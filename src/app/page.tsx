"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  CalendarCheck, 
  BedDouble, 
  TrendingUp, 
  Calendar as CalendarIcon,
  ChevronDown,
  Moon,
  XCircle,
  RefreshCw,
  Phone,
  MessageCircle,
  Sparkles,
  ArrowUpRight,
  MoreVertical,
  Heart,
  PlusCircle,
  Key,
  Wifi,
  Building2,
  BarChart3
} from "lucide-react";
import { getBookings, getProperties } from "@/lib/supabase";
import { Booking, Property } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { MetricCardsSkeleton, TableSkeleton } from "@/components/Skeleton";

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"month" | "quarter" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [uiMode, setUiMode] = useState<"Basic" | "Pro">("Pro");

  useEffect(() => {
    async function loadData() {
      const [bData, pData] = await Promise.all([getBookings(), getProperties()]);
      setBookings(bData);
      setProperties(pData);
      setLoading(false);
    }
    loadData();

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("damai_ui_mode");
      if (saved === "Basic" || saved === "Pro") {
        setUiMode(saved);
      } else if (saved === "EZ") {
        setUiMode("Basic");
      }

      const handler = () => {
        const current = localStorage.getItem("damai_ui_mode");
        if (current === "Basic" || current === "Pro") {
          setUiMode(current);
        }
      };
      window.addEventListener("ui_mode_change", handler);
      return () => window.removeEventListener("ui_mode_change", handler);
    }
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const todayStr = new Date().toISOString().split("T")[0];

  // Month-based filtering logic
  const isAllTime = selectedMonth === "all";
  const [selYear, selMonthNum] = !isAllTime ? selectedMonth.split("-").map(Number) : [2026, 9];
  const daysInSelMonth = !isAllTime ? new Date(selYear, selMonthNum, 0).getDate() : 30;
  const monthStart = `${selectedMonth}-01`;
  const monthEnd = `${selectedMonth}-${String(daysInSelMonth).padStart(2, "0")}`;

  const currentBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.booking_status === "cancelled") return false;
      if (isAllTime) return true;
      return b.check_in.startsWith(selectedMonth);
    });
  }, [bookings, isAllTime, selectedMonth]);

  const { monthRevenue, monthReservationsCount, monthNights, avgStay } = useMemo(() => {
    const rev = currentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const count = currentBookings.length;
    const nights = currentBookings.reduce((sum, b) => sum + (b.total_nights || 1), 0);
    const avg = count > 0 ? (nights / count).toFixed(1) : "0.0";
    return { monthRevenue: rev, monthReservationsCount: count, monthNights: nights, avgStay: avg };
  }, [currentBookings]);

  // Active bookings today
  const todayCheckIns = useMemo(() => bookings.filter((b) => b.check_in === todayStr), [bookings, todayStr]);
  const todayCheckOuts = useMemo(() => bookings.filter((b) => b.check_out === todayStr), [bookings, todayStr]);
  const confirmedCount = useMemo(() => {
    return currentBookings.filter((b) => b.booking_status === "confirmed" || b.booking_status === "checked_in").length;
  }, [currentBookings]);

  // Real occupancy calculation for selected month
  const { totalUnits, totalAvailableNights, occupiedRoomNights, occupancyRate, adr, revpar } = useMemo(() => {
    const units = properties.length || 3;
    const availNights = isAllTime ? (units * 365) : (units * daysInSelMonth);

    let occNights = 0;
    if (!isAllTime) {
      for (let day = 1; day <= daysInSelMonth; day++) {
        const dayStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
        for (const p of properties) {
          const hasBooking = bookings.some((b) => {
            if (b.booking_status === "cancelled") return false;
            const matchProp = b.property_id === p.id || (b.property?.name && p.name.toLowerCase() === b.property.name.toLowerCase());
            return matchProp && dayStr >= b.check_in && dayStr < b.check_out;
          });
          if (hasBooking) occNights++;
        }
      }
    } else {
      occNights = monthNights;
    }

    const rate = availNights > 0 
      ? Math.min(100, Math.round((occNights / availNights) * 100))
      : 0;

    const calculatedAdr = occNights > 0 ? Math.round(monthRevenue / occNights) : 0;
    const calculatedRevpar = availNights > 0 ? Math.round(monthRevenue / availNights) : 0;

    return {
      totalUnits: units,
      totalAvailableNights: availNights,
      occupiedRoomNights: occNights,
      occupancyRate: rate,
      adr: calculatedAdr,
      revpar: calculatedRevpar
    };
  }, [properties, isAllTime, daysInSelMonth, selectedMonth, bookings, monthNights, monthRevenue]);

  const tonightRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.booking_status !== "cancelled" && todayStr >= b.check_in && todayStr < b.check_out)
      .reduce((sum, b) => sum + Math.round((b.total_price || 0) / (b.total_nights || 1)), 0);
  }, [bookings, todayStr]);

  // Channel Breakdown for active period
  const { pDirect, pAirbnb, pBooking, directCount, airbnbCount, bookingComCount } = useMemo(() => {
    const activeForChannels = currentBookings.length > 0 ? currentBookings : bookings;
    const direct = activeForChannels.filter((b) => b.source === "direct_whatsapp" || (b.source as string) === "direct").length;
    const airbnb = activeForChannels.filter((b) => b.source === "airbnb").length;
    const bookingCom = activeForChannels.filter((b) => b.source === "booking_com" || b.source === "agoda" || b.source === "other").length;
    const total = direct + airbnb + bookingCom || 1;

    const directPct = Math.round((direct / total) * 100);
    const airbnbPct = Math.round((airbnb / total) * 100);
    const bookingPct = Math.max(0, 100 - directPct - airbnbPct);

    return {
      pDirect: directPct,
      pAirbnb: airbnbPct,
      pBooking: bookingPct,
      directCount: direct,
      airbnbCount: airbnb,
      bookingComCount: bookingCom
    };
  }, [currentBookings, bookings]);

  // Property-by-property breakdown for active period & today's status
  const propertyStats = useMemo(() => {
    return properties.map((p) => {
      const lowerName = (p.name || "").toLowerCase();
      const isMonthly = p.rental_type === "monthly" || p.id === "kemaman-1" || lowerName.includes("kemaman 1");

      const propBookings = currentBookings.filter((b) => {
        if (b.booking_status === "cancelled") return false;
        return b.property_id === p.id || (b.property?.name && p.name.toLowerCase() === b.property.name.toLowerCase());
      });

      const count = propBookings.length;
      const bookedNights = propBookings.reduce((sum, b) => sum + (b.total_nights || 1), 0);
      let revenue = propBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      // If monthly rental and revenue from bookings is 0, default to monthly rental rate
      if (isMonthly && revenue === 0) {
        revenue = p.monthly_rental_rate || 700;
      }

      const totalAvail = isAllTime ? 365 : daysInSelMonth;
      const occPct = totalAvail > 0 
        ? Math.min(100, Math.round((bookedNights / totalAvail) * 100))
        : 0;

      const activeToday = bookings.find(
        (b) =>
          (b.property_id === p.id || (b.property?.name && p.name.toLowerCase() === b.property.name.toLowerCase())) &&
          b.check_in <= todayStr &&
          b.check_out > todayStr &&
          b.booking_status !== "cancelled"
      );

      return {
        property: p,
        isMonthly,
        bookingsCount: count,
        bookedNights,
        revenue,
        occupancyRate: isMonthly ? 100 : occPct,
        activeToday,
      };
    });
  }, [properties, currentBookings, isAllTime, daysInSelMonth, bookings, todayStr]);

  const getCheckInWhatsAppMessage = (b: Booking) => {
    const propName = b.property?.name || "Homestay Kenangan";
    const guestName = b.guest?.name || (language === "bm" ? "Tuan/Puan" : "Guest");
    const lockCode = b.property?.smartlock_code || "1234#";
    const wifi = b.property?.wifi_ssid || "HomestayKenangan";
    const wifiPass = b.property?.wifi_password || "kenangan2026!";
    const mapsLink = b.property?.google_maps_url || "https://homestay-kenangan.vercel.app/";
    if (language === "en") {
      return `Dear ${guestName},\n\nWelcome to ${propName}! 🏡\n\nHere are your Check-in details:\n🕒 Check-in Time: 3:00 PM\n🔑 Smartlock PIN: ${lockCode}\n📶 WiFi: ${wifi} (Password: ${wifiPass})\n📍 Location Map: ${mapsLink}\n\nIf you have any questions during your stay, please contact us here. Have a great vacation!`;
    }
    return `Salam sejahtera ${guestName},\n\nSelamat datang ke ${propName}! 🏡\n\nBerikut adalah maklumat kemasukan (Check-in):\n🕒 Waktu Check-in: 3:00 Petang\n🔑 Kod Pintu Smartlock: ${lockCode}\n📶 WiFi: ${wifi} (Password: ${wifiPass})\n📍 Pautan Lokasi: ${mapsLink}\n\nSekiranya ada apa-apa pertanyaan semasa penginapan, sila hubungi kami di talian ini. Selamat bercuti!`;
  };

  const getCheckOutWhatsAppMessage = (b: Booking) => {
    const propName = b.property?.name || "Homestay Kenangan";
    const guestName = b.guest?.name || (language === "bm" ? "Tuan/Puan" : "Guest");
    if (language === "en") {
      return `Dear ${guestName},\n\nThank you for choosing ${propName} for your family holiday! ❤️\n\nWe hope you enjoyed your stay. Once the keys are in place and electrical appliances are turned off, your security deposit of RM ${b.deposit_amount || 100} will be refunded shortly.\n\nSee you again next time!`;
    }
    return `Salam sejahtera ${guestName},\n\nTerima kasih kerana memilih ${propName} untuk percutian anda sekeluarga! ❤️\n\nKami berharap anda berpuas hati sepanjang penginapan. Sekiranya kunci sudah diletakkan di tempat asal dan suis elektrik dipadamkan, deposit keselamatan anda sebanyak RM ${b.deposit_amount || 100} akan dipulangkan sebentar lagi.\n\nJumpa lagi di lain masa!`;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-16 max-w-7xl mx-auto">
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (uiMode === "Basic") {
    return (
      <div className="space-y-8 pb-16 max-w-6xl mx-auto">
        {/* 1. Header & Month Selector */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141A29] via-[#0E1524] to-[#121826] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black tracking-wider uppercase border border-amber-500/40 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>BASIC · PENGURUSAN MUDAH</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {language === "bm" ? "Prestasi & Operasi Homestay Kenangan 🏡" : "Homestay Kenangan Performance & Operations 🏡"}
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">
                {language === "bm" 
                  ? "Pusat kawalan ringkas dan mesra pengguna. Pantau prestasi hasil, tempahan, dan operasi harian tanpa pening kepala."
                  : "Intuitive command center. Track performance, reservations, and daily operations effortlessly."}
              </p>
            </div>

            {/* Quick Action & Month Switcher */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              {/* Interactive Month Selector */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none flex items-center gap-2 pl-9 pr-9 py-3 rounded-2xl bg-[#090D16] border border-amber-500/40 text-xs font-black text-amber-300 hover:border-amber-400 focus:outline-hidden focus:border-amber-400 cursor-pointer shadow-lg transition"
                >
                  <option value="2026-09">{language === "bm" ? "📅 September 2026" : "📅 September 2026"}</option>
                  <option value="2026-08">{language === "bm" ? "📅 Ogos 2026" : "📅 August 2026"}</option>
                  <option value="2026-10">{language === "bm" ? "📅 Oktober 2026" : "📅 October 2026"}</option>
                  <option value="2026-07">{language === "bm" ? "📅 Julai 2026" : "📅 July 2026"}</option>
                  <option value="2026-06">{language === "bm" ? "📅 Jun 2026" : "📅 June 2026"}</option>
                  <option value="2026-05">{language === "bm" ? "📅 Mei 2026" : "📅 May 2026"}</option>
                  <option value="all">{language === "bm" ? "📅 Semua Rekod (All Time)" : "📅 All Records (All Time)"}</option>
                </select>
                <CalendarIcon className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <Link
                href="/bookings/new"
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2 shrink-0"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t("dashboard.btn_register_guest")}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Ringkasan Prestasi Keseluruhan (Overall Property Performance - Simple, Clear, User Friendly) */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                {language === "bm" ? "JUMAAT · 20 SEPTEMBER 2026 · MUSIM PUNCAK" : "FRIDAY · 20 SEPTEMBER 2026 · PEAK SEASON"}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <span>
                  {language === "bm" ? (
                    <>Prestasi <span className="text-indigo-400">Keseluruhan Homestay</span></>
                  ) : (
                    <>Overall <span className="text-indigo-400">Property Performance</span></>
                  )}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "bm" 
                  ? `Kadar penginapan masa nyata, metrik pulangan, dan saluran jualan bagi semua unit (${selectedMonth === "all" ? "Semua Masa" : selectedMonth}).`
                  : `Real-time occupancy, revenue yield, and channel distribution across all units (${selectedMonth === "all" ? "All Time" : selectedMonth}).`}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE {language === "bm" ? "Auto: 5m" : "Auto: 5m"}</span>
              </div>
            </div>
          </div>

          {/* Occupancy Multi-Color Strip Card (Friendly, High Clarity) */}
          <div className="p-6 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              {/* Left: Occupancy Big Number */}
              <div className="flex items-baseline gap-2.5 shrink-0">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{occupancyRate}%</span>
                <span className="text-xs font-black tracking-wider text-slate-400 uppercase">
                  {language === "bm" ? "KADAR PENGINAPAN" : "OCCUPANCY RATE"}
                </span>
              </div>

              {/* Center: Multi-Color Progress Bar & Legend */}
              <div className="flex-1 space-y-2.5 max-w-3xl">
                {/* Multi-segment Bar */}
                <div className="h-3.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                  <div 
                    className="h-full bg-cyan-400 rounded-l-full transition-all duration-500" 
                    style={{ width: `${Math.max(5, occupancyRate)}%` }} 
                    title={`Occupied (${occupancyRate}%)`} 
                  />
                  <div 
                    className="h-full bg-slate-700 rounded-r-full transition-all duration-500" 
                    style={{ width: `${Math.max(5, 100 - occupancyRate)}%` }} 
                    title={`Available (${100 - occupancyRate}%)`} 
                  />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-cyan-400" />
                    <span className="text-slate-200 font-bold">{occupiedRoomNights}</span> {language === "bm" ? "Malam Ditempah" : "Nights Booked"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                    <span className="text-slate-200 font-bold">{todayCheckIns.length}</span> {language === "bm" ? "Masuk Hari Ini" : "Arriving Today"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-rose-500" />
                    <span className="text-slate-200 font-bold">{todayCheckOuts.length}</span> {language === "bm" ? "Keluar Hari Ini" : "Departing Today"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-slate-600" />
                    <span className="text-slate-200 font-bold">{Math.max(0, totalAvailableNights - occupiedRoomNights)}</span> {language === "bm" ? "Malam Kosong" : "Available Nights"}
                  </span>
                </div>
              </div>

              {/* Right: 4 Mini Financial KPIs */}
              <div className="flex items-center gap-4 sm:gap-6 border-t xl:border-t-0 xl:border-l border-slate-800 pt-4 xl:pt-0 xl:pl-6 shrink-0">
                <div>
                  <div className="text-base font-black text-indigo-400 font-mono">{formatCurrency(adr)}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ADR ({language === "bm" ? "Purata/mlm" : "Avg/night"})</div>
                </div>
                <div>
                  <div className="text-base font-black text-emerald-400 font-mono">{formatCurrency(revpar)}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REVPAR ({language === "bm" ? "Hasil/unit" : "Yield/room"})</div>
                </div>
                <div>
                  <div className="text-base font-black text-white font-mono">{formatCurrency(tonightRevenue)}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "bm" ? "MALAM INI" : "TONIGHT"}</div>
                </div>
                <div>
                  <div className="text-base font-black text-amber-400">4.9 ★</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "bm" ? "PENILAIAN" : "RATING"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Core Metric Cards (Same as Pro, User-Friendly Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Gross Revenue */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
                  {selectedMonth === "all" ? "Semua Rekod" : selectedMonth}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight font-mono">{formatCurrency(monthRevenue)}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {language === "bm" ? "JUMLAH PENDAPATAN" : "TOTAL REVENUE"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {language === "bm" ? "Hasil jualan terkumpul portfolio" : "Portfolio cumulative revenue"}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Malam Ini:" : "Tonight:"}</span>
                <span className="text-emerald-400 font-black font-mono">
                  {tonightRevenue > 0 ? formatCurrency(tonightRevenue) : (language === "bm" ? "Tiada inap" : "No stay")}
                </span>
              </div>
            </div>

            {/* Card 2: Total Bookings */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                  {confirmedCount} {language === "bm" ? "Aktif" : "Active"}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight font-mono">{monthReservationsCount}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {language === "bm" ? "JUMLAH TEMPAHAN" : "TOTAL BOOKINGS"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {language === "bm" ? `${monthNights} malam tempahan keseluruhan` : `${monthNights} nights total booked`}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Status:" : "Status:"}</span>
                <span className="text-cyan-400 font-bold">{confirmedCount} {language === "bm" ? "disahkan" : "confirmed"}</span>
              </div>
            </div>

            {/* Card 3: Avg Length of Stay */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  ▲ 0.4 {language === "bm" ? "malam" : "nights"}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">{avgStay} {language === "bm" ? "Mlm" : "Nts"}</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {language === "bm" ? "PURATA TEMPOH INAP" : "AVG LENGTH OF STAY"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {language === "bm" ? "Malam setiap tempahan tetamu" : "Nights per guest booking"}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Nisbah:" : "Ratio:"}</span>
                <span className="text-amber-400 font-bold">{avgStay} {language === "bm" ? "mlm/tetamu" : "nts/guest"}</span>
              </div>
            </div>

            {/* Card 4: Cancellation Rate */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xs">
                  <XCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  ✅ {language === "bm" ? "Cemerlang" : "Optimal"}
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">0.0%</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {language === "bm" ? "KADAR PEMBATALAN" : "CANCELLATION RATE"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {language === "bm" ? "Sifar pembatalan bulan ini" : "Zero cancellations this month"}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Impak Hasil:" : "Revenue Loss:"}</span>
                <span className="text-emerald-400 font-bold">RM 0 (0%)</span>
              </div>
            </div>

            {/* Card 5: Repeat Guest Rate */}
            <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-teal-950/80 border border-teal-500/30 text-teal-400 flex items-center justify-center text-xs">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  ▲ 5.8%
                </span>
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">44.2%</div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {language === "bm" ? "TETAMU BERULANG" : "REPEAT GUEST RATE"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {language === "bm" ? "Kesetiaan tetamu tinggi & repeat booking" : "High customer retention & rebooking"}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Kepuasan:" : "Rating:"}</span>
                <span className="text-amber-400 font-bold">4.9 ★★★★★</span>
              </div>
            </div>
          </div>

          {/* Dual Analytics Row: Revenue per Available Room Trend & Booking Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: RevPAR Trend Chart (8 cols) */}
            <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>{language === "bm" ? "Trend Pulangan Seunit (RevPAR)" : "Revenue Per Available Room Trend"}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === "bm" 
                      ? "Prestasi hasil setiap unit bilik ketersediaan — September 2026 vs Ogos 2026" 
                      : "RevPAR yield performance — September 2026 vs August 2026"}
                  </p>
                </div>

                {/* Period switch */}
                <div className="flex items-center bg-[#111726] p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartPeriod("month")}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      chartPeriod === "month" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {language === "bm" ? "Bulan" : "Month"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartPeriod("quarter")}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      chartPeriod === "quarter" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {language === "bm" ? "Suku" : "Quarter"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartPeriod("year")}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      chartPeriod === "year" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {language === "bm" ? "Tahun" : "Year"}
                  </button>
                </div>
              </div>

              {/* Glowing SVG Line Chart */}
              <div className="pt-2">
                <div className="h-52 w-full relative flex items-end">
                  <svg viewBox="0 0 700 200" className="w-full h-52 overflow-visible">
                    <defs>
                      <linearGradient id="basicAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid horizontal lines */}
                    <line x1="0" y1="40" x2="700" y2="40" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="0" y1="90" x2="700" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="700" y2="140" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="0" y1="190" x2="700" y2="190" stroke="#1e293b" />

                    {/* Previous Period Line (Cyan Dashed) */}
                    <path
                      d="M 0,170 Q 150,140 300,150 T 500,120 T 700,110"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />

                    {/* Main Period Area Fill */}
                    <path
                      d="M 0,160 Q 140,110 280,120 T 480,60 T 700,50 L 700,190 L 0,190 Z"
                      fill="url(#basicAreaGradient)"
                    />

                    {/* Main Period Line (Glowing Indigo) */}
                    <path
                      d="M 0,160 Q 140,110 280,120 T 480,60 T 700,50"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      className="drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                    />

                    {/* Highlight Point */}
                    <circle cx="480" cy="60" r="5" fill="#ffffff" stroke="#6366f1" strokeWidth="3" />
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-2">
                  <span>Sep 1</span>
                  <span>Sep 5</span>
                  <span>Sep 10</span>
                  <span>Sep 15</span>
                  <span>Sep 20</span>
                  <span>Sep 25</span>
                  <span>Sep 30</span>
                </div>

                {/* Bottom Legend & Peak Callout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800/80 pt-3 mt-4 text-xs gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                      <span className="w-3 h-0.5 bg-indigo-500" /> September 2026 ({language === "bm" ? "Bulan Ini" : "Current"})
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                      <span className="w-3 h-0.5 bg-cyan-400 stroke-dashed" /> Ogos 2026 ({language === "bm" ? "Bulan Lalu" : "Previous"})
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>{language === "bm" ? "Puncak Tertinggi:" : "Peak RevPAR:"}</span>
                    <span className="text-indigo-400 font-black">RM 298</span>
                    <span className="text-slate-400 font-normal">({language === "bm" ? "pada 20 Sep" : "on Sep 20"})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Booking Channels Donut (4 cols) */}
            <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base tracking-tight">
                  {language === "bm" ? "Saluran Tempahan" : "Booking Channels"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === "bm" ? "Pecahan sumber tempahan tetamu" : "Guest booking source mix"}
                </p>
              </div>

              {/* Donut Chart with Ambient Glow */}
              <div className="py-2 flex justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

                  <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#182035" strokeWidth="12" />
                    {/* Direct */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="12"
                      strokeDasharray={`${(pDirect / 100) * 238.76} 238.76`}
                      strokeDashoffset="0"
                    />
                    {/* Booking.com */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="12"
                      strokeDasharray={`${(pBooking / 100) * 238.76} 238.76`}
                      strokeDashoffset={`-${(pDirect / 100) * 238.76}`}
                    />
                    {/* Airbnb */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={`${(pAirbnb / 100) * 238.76} 238.76`}
                      strokeDashoffset={`-${((pDirect + pBooking) / 100) * 238.76}`}
                    />
                  </svg>

                  {/* Center Label */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black text-white leading-none font-mono">{monthReservationsCount}</span>
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-0.5">
                      {language === "bm" ? "TEMPAHAN" : "BOOKINGS"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Channel Legend List */}
              <div className="space-y-2.5 text-xs border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-200 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-xs bg-sky-400" /> Direct WhatsApp
                    <span className="px-1.5 py-0.5 rounded-sm bg-emerald-950 text-emerald-400 text-[9px] font-bold border border-emerald-800/80">0% Fee</span>
                  </span>
                  <span className="text-slate-400 font-bold">
                    <span className="text-white font-black">{directCount}</span> · {pDirect}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" /> Booking.com
                  </span>
                  <span className="text-slate-400 font-bold">
                    <span className="text-white font-black">{bookingComCount}</span> · {pBooking}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" /> Airbnb
                  </span>
                  <span className="text-slate-400 font-bold">
                    <span className="text-white font-black">{airbnbCount}</span> · {pAirbnb}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Prestasi & Ketersediaan Mengikut Setiap Homestay (Property Breakdown Cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{language === "bm" ? "Prestasi & Status Setiap Homestay" : "Performance & Status by Property"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "bm" 
                  ? "Hasil jualan, kadar bilik terisi, dan ketersediaan semasa bagi setiap unit Kemaman & Gong Badak."
                  : "Revenue, occupancy rate, and real-time status for each Kemaman & Gong Badak unit."}
              </p>
            </div>
            <Link
              href="/properties"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
            >
              <span>{language === "bm" ? "Urus Semua Unit →" : "Manage Units →"}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {propertyStats.map(({ property: p, isMonthly, bookingsCount: pCount, bookedNights: pNights, revenue: pRev, occupancyRate: pOcc, activeToday }) => {
              return (
                <div 
                  key={p.id}
                  className={`p-5 sm:p-6 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                    isMonthly
                      ? "bg-[#12110D] border-amber-500/40 shadow-lg shadow-amber-500/5"
                      : activeToday 
                      ? "bg-[#15101A] border-rose-500/40 shadow-lg shadow-rose-500/5" 
                      : "bg-[#091515] border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                  }`}
                >
                  {/* Property Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        {p.total_rooms} {language === "bm" ? "Bilik" : "Rooms"} · {p.total_toilets ? `${p.total_toilets} Toilet · ` : ""}{p.total_bathrooms || 1} Bath
                      </span>
                      {isMonthly ? (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black uppercase tracking-wider shrink-0">
                          🏠 ROOM RENTAL
                        </span>
                      ) : activeToday ? (
                        <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                          🔒 {language === "bm" ? "ADA TETAMU" : "OCCUPIED"}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0 animate-pulse">
                          ✅ {language === "bm" ? "KOSONG (READY)" : "AVAILABLE"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.address || "Kemaman, Terengganu"}</p>
                  </div>

                  {/* Property Performance Metrics Box (Revenue, Bookings, Occupancy for this property) */}
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-slate-800/80 space-y-2.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>{language === "bm" ? "Prestasi Unit Bulan Ini:" : "Unit Performance This Month:"}</span>
                      <span className="text-indigo-400 font-mono">{selectedMonth === "all" ? "All Time" : selectedMonth}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-800/60">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === "bm" ? "Hasil" : "Revenue"}</div>
                        <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">{formatCurrency(pRev)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === "bm" ? "Tempahan" : "Bookings"}</div>
                        <div className="text-sm font-black text-white font-mono mt-0.5">
                          {isMonthly ? "Bulanan" : `${pCount} (${pNights}m)`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === "bm" ? "Occupancy" : "Occupancy"}</div>
                        <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">{pOcc}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Current Status Detail Box */}
                  {isMonthly ? (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">{t("dashboard.monthly_fixed_rate")}</span>
                      <div className="text-lg font-black text-white font-mono">
                        RM {p.monthly_rental_rate || 700} <span className="text-xs text-amber-300 font-normal">/ {language === "bm" ? "bulan" : "month"}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {language === "bm" ? "Rumah belakang (2 bilik 1 toilet 1 bath)" : "Back house (2 beds 1 toilet 1 bath)"}
                      </div>
                    </div>
                  ) : activeToday ? (
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs space-y-1">
                      <div className="text-rose-200 font-bold">{language === "bm" ? "Tetamu Semasa:" : "Current Guest:"} {activeToday.guest?.name || "Guest"}</div>
                      <div className="text-slate-400 text-[11px]">
                        {language === "bm" ? "Tarikh Keluar:" : "Check-out:"} <span className="text-white font-bold">{formatDate(activeToday.check_out)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{t("dashboard.daily_rate_today")}</span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-bold">Direct WA:</span>
                        <span className="text-white font-black font-mono">{formatCurrency(p.price_direct || p.base_price_per_night)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Airbnb / Booking:</span>
                        <span className="font-mono">{formatCurrency(p.price_airbnb || Math.round(p.base_price_per_night * 1.18))}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Quick Reference: Door Lock, WiFi & Link */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>{p.smartlock_code}</span>
                    </span>
                    <Link
                      href="/properties"
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                    >
                      <span>{language === "bm" ? "Butiran Unit →" : "Unit Details →"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Tindakan Penting Hari Ini: Check-In & Check-Out Today */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Tetamu Masuk Hari Ini */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border-2 border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl shadow-lg">
                  🛎️
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{t("dashboard.checkin_today")}</h2>
                  <p className="text-xs text-slate-400">{language === "bm" ? "Tarikh:" : "Date:"} {formatDate(todayStr)}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 font-black text-sm border border-emerald-800/60">
                {todayCheckIns.length} {language === "bm" ? "Tetamu" : "Guests"}
              </span>
            </div>

            {todayCheckIns.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800 text-center space-y-2">
                <p className="text-sm font-bold text-slate-300">{t("dashboard.checkin_none")}</p>
                <p className="text-xs text-slate-400">{t("dashboard.checkin_none_sub")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayCheckIns.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-[#111726] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-black text-white">{b.guest?.name || (language === "bm" ? "Tetamu" : "Guest")}</div>
                        <div className="text-xs font-bold text-indigo-400 mt-0.5">{b.property?.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5" /> {b.guest?.phone || "-"}
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 font-mono">
                        {formatCurrency(b.total_price)}
                      </span>
                    </div>

                    {b.guest?.phone && (
                      <a
                        href={generateWhatsAppUrl(b.guest.phone, getCheckInWhatsAppMessage(b))}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{language === "bm" ? "Hantar Kod Pintu & Alamat ke WhatsApp" : "Send Door PIN & Address via WhatsApp"}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: Tetamu Keluar Hari Ini */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border-2 border-rose-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center text-xl shadow-lg">
                  🚪
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{t("dashboard.checkout_today")}</h2>
                  <p className="text-xs text-slate-400">{language === "bm" ? "Check-out sebelum 12:00 tengah hari" : "Check-out before 12:00 PM"}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-rose-950 text-rose-400 font-black text-sm border border-rose-800/60">
                {todayCheckOuts.length} {language === "bm" ? "Tetamu" : "Guests"}
              </span>
            </div>

            {todayCheckOuts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800 text-center space-y-2">
                <p className="text-sm font-bold text-slate-300">{t("dashboard.checkout_none")}</p>
                <p className="text-xs text-slate-400">{language === "bm" ? "Tiada keperluan untuk pembersihan bilik serta-merta hari ini." : "No immediate room turnover required today."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayCheckOuts.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-[#111726] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-black text-white">{b.guest?.name || (language === "bm" ? "Tetamu" : "Guest")}</div>
                        <div className="text-xs font-bold text-indigo-400 mt-0.5">{b.property?.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{language === "bm" ? "Deposit Perlu Pulang:" : "Refund Deposit:"} RM {b.deposit_amount || 100}</div>
                      </div>
                      <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800">
                        Check-out
                      </span>
                    </div>

                    {b.guest?.phone && (
                      <a
                        href={generateWhatsAppUrl(b.guest.phone, getCheckOutWhatsAppMessage(b))}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center gap-2 border border-slate-700 transition"
                      >
                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                        <span>{language === "bm" ? "Hantar WhatsApp Terima Kasih & Deposit" : "Send WhatsApp Thank You & Deposit"}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Senarai Tempahan Terkini (Recent Reservations - Simple, Clean & Actionable) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-indigo-400" />
                <span>{t("dashboard.recent_bookings")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "bm" 
                  ? "Senarai tempahan terkini dari Direct WhatsApp, Airbnb, dan Booking.com."
                  : "Latest bookings across Direct WhatsApp, Airbnb, and Booking.com."}
              </p>
            </div>
            <Link
              href="/bookings"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111726] border border-slate-800 text-indigo-400 hover:text-white text-xs font-bold transition hover:border-slate-700"
            >
              <span>{language === "bm" ? "Lihat Semua Tempahan" : "View All Bookings"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111726] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t("bookings.col_guest")}</th>
                  <th className="py-3 px-4">{t("bookings.col_property")}</th>
                  <th className="py-3 px-4">{t("bookings.col_dates")}</th>
                  <th className="py-3 px-4">{t("bookings.col_total")}</th>
                  <th className="py-3 px-4">{t("bookings.col_channel")}</th>
                  <th className="py-3 px-4 text-right">{t("bookings.col_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(currentBookings.length > 0 ? currentBookings : bookings).slice(0, 5).map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-xs">{bk.guest?.name || (language === "bm" ? "Tetamu" : "Guest")}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {bk.guest?.phone || "-"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {bk.property?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{formatDate(bk.check_in)}</div>
                      <div className="text-[10px] text-slate-400">hingga {formatDate(bk.check_out)} ({bk.total_nights} {language === "bm" ? "m" : "n"})</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-indigo-300 font-mono">{formatCurrency(bk.total_price)}</div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase mt-0.5 ${
                        bk.payment_status === "fully_paid"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                          : bk.payment_status === "deposit_paid"
                          ? "bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                          : "bg-amber-950 text-amber-400 border border-amber-800/60"
                      }`}>
                        {bk.payment_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        {bk.source.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {bk.guest?.phone && (
                        <a
                          href={generateWhatsAppUrl(
                            bk.guest.phone,
                            `Salam ${bk.guest.name}, tempahan anda di ${bk.property?.name || "Homestay Kenangan"} disahkan!`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Performance Header (Matching StayVault Reference) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
            {language === "bm" ? "JUMAAT · 20 SEPTEMBER 2026 · MUSIM PUNCAK" : "FRIDAY · 20 SEPTEMBER 2026 · PEAK SEASON"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            {language === "bm" ? (
              <>Prestasi <span className="text-indigo-400">Homestay</span></>
            ) : (
              <>Property <span className="text-indigo-400">Performance</span></>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === "bm" 
              ? "Kadar penginapan masa nyata, metrik pendapatan, dan tetamu masuk untuk Homestay Kenangan."
              : "Real-time occupancy, revenue metrics, and upcoming arrivals for Homestay Kenangan."}
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Interactive Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-9 pr-8 py-2 rounded-xl bg-[#0E1320] border border-slate-800 text-xs font-bold text-indigo-300 hover:border-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-md"
            >
              <option value="2026-09">{language === "bm" ? "September 2026" : "September 2026"}</option>
              <option value="2026-08">{language === "bm" ? "Ogos 2026" : "August 2026"}</option>
              <option value="2026-10">{language === "bm" ? "Oktober 2026" : "October 2026"}</option>
              <option value="2026-07">{language === "bm" ? "Julai 2026" : "July 2026"}</option>
              <option value="2026-06">{language === "bm" ? "Jun 2026" : "June 2026"}</option>
              <option value="2026-05">{language === "bm" ? "Mei 2026" : "May 2026"}</option>
              <option value="all">{language === "bm" ? "Semua Rekod (All Time)" : "All Records (All Time)"}</option>
            </select>
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Live Auto-refresh Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E1320] border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold">
              <span className="text-emerald-400 font-bold">LIVE</span> {language === "bm" ? "Auto-kemaskini: 5m" : "Auto-refresh: 5m"}
            </span>
          </div>
        </div>
      </div>

      {/* Occupancy Multi-Color Strip Card (Exact Match of StayVault) */}
      <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Occupancy Big Number */}
          <div className="flex items-baseline gap-2.5 shrink-0">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{occupancyRate}%</span>
            <span className="text-xs font-black tracking-wider text-slate-400 uppercase">
              {language === "bm" ? "KADAR PENGINAPAN" : "OCCUPANCY"}
            </span>
          </div>

          {/* Center: Multi-Color Progress Bar & Legend */}
          <div className="flex-1 space-y-2.5 max-w-3xl">
            {/* Multi-segment Bar */}
            <div className="h-3.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div 
                className="h-full bg-cyan-400 rounded-l-full transition-all duration-500" 
                style={{ width: `${Math.max(5, occupancyRate)}%` }} 
                title={`Occupied (${occupancyRate}%)`} 
              />
              <div 
                className="h-full bg-slate-700 rounded-r-full transition-all duration-500" 
                style={{ width: `${Math.max(5, 100 - occupancyRate)}%` }} 
                title={`Available (${100 - occupancyRate}%)`} 
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-cyan-400" />
                <span className="text-slate-300 font-bold">{occupiedRoomNights}</span> {language === "bm" ? "Malam Ditempah" : "Nights Booked"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                <span className="text-slate-300 font-bold">{todayCheckIns.length}</span> {language === "bm" ? "Masuk Hari Ini" : "Arriving Today"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-rose-500" />
                <span className="text-slate-300 font-bold">{todayCheckOuts.length}</span> {language === "bm" ? "Keluar Hari Ini" : "Departing"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-slate-600" />
                <span className="text-slate-300 font-bold">{Math.max(0, totalAvailableNights - occupiedRoomNights)}</span> {language === "bm" ? "Malam Kosong" : "Available Nights"}
              </span>
            </div>
          </div>

          {/* Right: 4 Mini Financial KPIs */}
          <div className="flex items-center gap-5 sm:gap-7 border-t xl:border-t-0 xl:border-l border-slate-800 pt-4 xl:pt-0 xl:pl-6 shrink-0">
            <div>
              <div className="text-base font-black text-indigo-400 font-mono">{formatCurrency(adr)}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ADR</div>
            </div>
            <div>
              <div className="text-base font-black text-emerald-400 font-mono">{formatCurrency(revpar)}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REVPAR</div>
            </div>
            <div>
              <div className="text-base font-black text-white font-mono">{formatCurrency(tonightRevenue)}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "bm" ? "MALAM INI" : "TONIGHT REV"}</div>
            </div>
            <div>
              <div className="text-base font-black text-amber-400">4.9 ★</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === "bm" ? "PENILAIAN" : "AVG RATING"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Metric Cards Row (Exact Match of StayVault) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
              {selectedMonth === "all" ? "Semua Masa" : selectedMonth}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight font-mono">{formatCurrency(monthRevenue)}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "bm" ? "JUMLAH PENDAPATAN" : "MONTHLY REVENUE"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {selectedMonth === "2026-09" 
                ? (language === "bm" ? "Bulan September 2026" : "September 2026 Total")
                : (language === "bm" ? `Bulan ${selectedMonth}` : `Period: ${selectedMonth}`)}
            </div>
          </div>
        </div>

        {/* Card 2: Reservations MTD */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
              {confirmedCount} {language === "bm" ? "Aktif" : "Active"}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight font-mono">{monthReservationsCount}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "bm" ? "JUMLAH TEMPAHAN" : "RESERVATIONS"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {language === "bm" ? `${monthNights} malam tempahan` : `${monthNights} nights total`}
            </div>
          </div>
        </div>

        {/* Card 3: Avg Length of Stay */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs">
              <Moon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ▲ 0.4 {language === "bm" ? "malam" : "nights"}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{avgStay}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "bm" ? "PURATA TEMPOH INAP" : "AVG LENGTH OF STAY"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{language === "bm" ? "Malam setiap tempahan" : "Nights per booking"}</div>
          </div>
        </div>

        {/* Card 4: Cancellation Rate */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xs">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-400 border border-rose-800/60">
              ▲ 1.2%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">0.0%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "bm" ? "KADAR PEMBATALAN" : "CANCELLATION RATE"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{language === "bm" ? "Sifar pembatalan bulan ini" : "Zero cancellations this month"}</div>
          </div>
        </div>

        {/* Card 5: Repeat Guest Rate */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/30 text-teal-400 flex items-center justify-center text-xs">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ▲ 5.8%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">44.2%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {language === "bm" ? "TETAMU BERULANG" : "REPEAT GUEST RATE"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{language === "bm" ? "Kesetiaan tetamu tinggi" : "High customer retention"}</div>
          </div>
        </div>
      </div>

      {/* Dual Bottom Section (Matching StayVault) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue Per Available Room Trend Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-white text-sm tracking-tight">
                {language === "bm" ? "Hasil Mengikut Bilik Ketersediaan" : "Revenue Per Available Room"}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === "bm" ? "Trend RevPAR bulanan" : "RevPAR trend — September 2026 vs August 2026"}
              </p>
            </div>

            {/* Month / Quarter / Year Toggle */}
            <div className="flex items-center bg-[#111726] p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartPeriod("month")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  chartPeriod === "month" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                {language === "bm" ? "Bulan" : "Month"}
              </button>
              <button
                onClick={() => setChartPeriod("quarter")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  chartPeriod === "quarter" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                {language === "bm" ? "Suku" : "Quarter"}
              </button>
              <button
                onClick={() => setChartPeriod("year")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  chartPeriod === "year" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                {language === "bm" ? "Tahun" : "Year"}
              </button>
            </div>
          </div>

          {/* Glowing SVG Line Chart (Matching StayVault) */}
          <div className="pt-2">
            <div className="h-56 w-full relative flex items-end">
              <svg viewBox="0 0 700 200" className="w-full h-56 overflow-visible">
                <defs>
                  {/* Indigo Area Gradient */}
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="700" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="700" y2="140" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="190" x2="700" y2="190" stroke="#1e293b" />

                {/* Previous Period Line (Cyan Dashed) */}
                <path
                  d="M 0,170 Q 150,140 300,150 T 500,120 T 700,110"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />

                {/* Main Period Area Fill */}
                <path
                  d="M 0,160 Q 140,110 280,120 T 480,60 T 700,50 L 700,190 L 0,190 Z"
                  fill="url(#areaGradient)"
                />

                {/* Main Period Line (Glowing Indigo) */}
                <path
                  d="M 0,160 Q 140,110 280,120 T 480,60 T 700,50"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  className="drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                />

                {/* Highlight Point */}
                <circle cx="480" cy="60" r="5" fill="#ffffff" stroke="#6366f1" strokeWidth="3" />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-2">
              <span>Sep 1</span>
              <span>Sep 5</span>
              <span>Sep 10</span>
              <span>Sep 15</span>
              <span>Sep 20</span>
              <span>Sep 25</span>
              <span>Sep 30</span>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-4 text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                  <span className="w-3 h-0.5 bg-indigo-500" /> September 2026
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                  <span className="w-3 h-0.5 bg-cyan-400 stroke-dashed" /> August 2026
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-400">
                Peak RevPAR: <span className="text-indigo-400 font-black">RM 298</span> on Sep 20
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Channels Donut (4 cols, Exact Match of StayVault) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-extrabold text-white text-sm tracking-tight">
              {language === "bm" ? "Saluran Tempahan" : "Booking Channels"}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === "bm" ? "Pecahan sumber tempahan" : "Source mix this month"}
            </p>
          </div>

          {/* Donut in Glowing Sphere */}
          <div className="py-4 flex justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer Ambient Glow */}
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

              <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#182035" strokeWidth="12" />
                {/* Direct */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="12"
                  strokeDasharray={`${(pDirect / 100) * 238.76} 238.76`}
                  strokeDashoffset="0"
                />
                {/* Booking.com */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="12"
                  strokeDasharray={`${(pBooking / 100) * 238.76} 238.76`}
                  strokeDashoffset={`-${(pDirect / 100) * 238.76}`}
                />
                {/* Airbnb */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${(pAirbnb / 100) * 238.76} 238.76`}
                  strokeDashoffset={`-${((pDirect + pBooking) / 100) * 238.76}`}
                />
              </svg>

              {/* Glowing Center Label */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-white leading-none font-mono">{monthReservationsCount}</span>
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-0.5">
                  {language === "bm" ? "TEMPAHAN" : "BOOKINGS"}
                </span>
              </div>
            </div>
          </div>

          {/* Channel Legend List */}
          <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-400" /> Direct / WhatsApp
              </span>
              <span className="text-slate-400 font-bold">
                <span className="text-white font-black">{directCount}</span> · {pDirect}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" /> Booking.com
              </span>
              <span className="text-slate-400 font-bold">
                <span className="text-white font-black">{bookingComCount}</span> · {pBooking}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" /> Airbnb
              </span>
              <span className="text-slate-400 font-bold">
                <span className="text-white font-black">{airbnbCount}</span> · {pAirbnb}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reservations Section */}
      <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight">
              {t("dashboard.recent_bookings")}
            </h2>
            <p className="text-xs text-slate-400">
              {language === "bm" ? "Semua tempahan melalui Direct, Airbnb, dan Booking.com" : "All bookings across Direct, Airbnb, and Booking.com"}
            </p>
          </div>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111726] border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            <span>{language === "bm" ? "Lihat Semua" : "View All"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111726] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t("bookings.col_guest")}</th>
                <th className="py-3 px-4">{t("bookings.col_property")}</th>
                <th className="py-3 px-4">{t("bookings.col_dates")}</th>
                <th className="py-3 px-4">{t("bookings.col_total")}</th>
                <th className="py-3 px-4">{t("bookings.col_status")}</th>
                <th className="py-3 px-4">{t("bookings.col_channel")}</th>
                <th className="py-3 px-4 text-right">{t("bookings.col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{bk.guest?.name || (language === "bm" ? "Tetamu" : "Guest")}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {bk.guest?.phone || "-"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {bk.property?.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{formatDate(bk.check_in)}</div>
                    <div className="text-[10px] text-slate-400">to {formatDate(bk.check_out)} ({bk.total_nights} {language === "bm" ? "m" : "n"})</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-black text-indigo-300">{formatCurrency(bk.total_price)}</div>
                    <div className="text-[10px] text-slate-400">{bk.payment_status}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      bk.booking_status === "confirmed"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                        : bk.booking_status === "checked_in"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60"
                        : "bg-amber-950 text-amber-300 border border-amber-800/60"
                    }`}>
                      {bk.booking_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {bk.source.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {bk.guest?.phone && (
                      <a
                        href={generateWhatsAppUrl(
                          bk.guest.phone,
                          `Salam ${bk.guest.name}, tempahan anda telah disahkan!`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg font-bold text-[11px] transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}