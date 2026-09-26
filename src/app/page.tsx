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

  const totalAllIncome = useMemo(() => {
    return propertyStats.reduce((sum, p) => sum + p.revenue, 0);
  }, [propertyStats]);

  const totalBookedDays = useMemo(() => {
    return propertyStats.reduce((sum, p) => sum + (p.isMonthly ? (isAllTime ? 365 : daysInSelMonth) : p.bookedNights), 0);
  }, [propertyStats, isAllTime, daysInSelMonth]);

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
      <div className="space-y-6 sm:space-y-8 pb-16 max-w-5xl mx-auto">
        {/* 1. Header & Month Selector */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#141A29] via-[#0E1524] to-[#121826] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black tracking-wider uppercase border border-amber-500/40 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>BASIC · RINGKAS & PADAT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {language === "bm" ? "Ringkasan Prestasi Homestay 🏡" : "Homestay Summary Dashboard 🏡"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl font-medium">
                {language === "bm" 
                  ? "Paparan ringkas 4 perkara penting: Total pendapatan, perbandingan antara 3 homestay, sumber tempahan, dan jumlah hari tempahan."
                  : "Concise view of 4 key essentials: Total revenue, 3-property income comparison, booking sources, and total booked days."}
              </p>
            </div>

            {/* Quick Action & Month Switcher */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none flex items-center gap-2 pl-9 pr-9 py-2.5 rounded-2xl bg-[#090D16] border border-amber-500/40 text-xs font-black text-amber-300 hover:border-amber-400 focus:outline-hidden focus:border-amber-400 cursor-pointer shadow-lg transition"
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
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("dashboard.btn_register_guest")}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Dua Metrik Utama: Total Income (All Properties) & Total Hari Tempahan Semua Property */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Total Income All Properties */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border-2 border-emerald-500/40 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl shadow-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-wider uppercase text-emerald-400">
                    {language === "bm" ? "TOTAL INCOME ALL PROPERTIES" : "TOTAL INCOME (ALL PROPERTIES)"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {language === "bm" ? "Jumlah Pendapatan Semua Homestay" : "Combined Income Across All Homestays"}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-mono">
                {selectedMonth === "all" ? (language === "bm" ? "Semua Masa" : "All Time") : selectedMonth}
              </span>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                {formatCurrency(totalAllIncome)}
              </div>
              <p className="text-xs text-slate-300 mt-2 font-medium">
                {language === "bm" 
                  ? "Jumlah kutipan terkumpul bagi ketiga-tiga unit (Kemaman 1, Kemaman 2, dan Gong Badak)."
                  : "Total cumulative revenue for all 3 units (Kemaman 1, Kemaman 2, and Gong Badak)."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{language === "bm" ? "Purata setiap hartanah:" : "Average per property:"}</span>
              <span className="text-emerald-400 font-bold font-mono">
                {formatCurrency(Math.round(totalAllIncome / (properties.length || 3)))}
              </span>
            </div>
          </div>

          {/* Card 2: Total Berapa Hari Tempahan Semua Property */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border-2 border-cyan-500/40 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xl shadow-lg">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-black tracking-wider uppercase text-cyan-400">
                    {language === "bm" ? "TOTAL HARI TEMPAHAN" : "TOTAL BOOKED DAYS"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {language === "bm" ? "Semua Property Terkumpul" : "Across All Properties"}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono">
                {monthReservationsCount} {language === "bm" ? "Tempahan" : "Bookings"}
              </span>
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {monthNights} <span className="text-lg font-bold text-slate-400">{language === "bm" ? "Hari / Malam" : "Days / Nights"}</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 font-medium">
                {language === "bm" 
                  ? "Jumlah keseluruhan malam dan hari yang ditempah tetamu merentas ketiga-tiga unit."
                  : "Total number of nights and days booked by guests across all 3 units."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{language === "bm" ? "Purata tempoh sewaan:" : "Average stay duration:"}</span>
              <span className="text-cyan-400 font-bold font-mono">
                {avgStay} {language === "bm" ? "malam/tempahan" : "nights/booking"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Income Comparison Antara 3 Property */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                {language === "bm" ? "PERBANDINGAN PENDAPATAN" : "INCOME COMPARISON"}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{language === "bm" ? "Income Comparison Antara 3 Property" : "Income Comparison Across 3 Properties"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "bm" 
                  ? "Perbandingan hasil jualan dan bahagian sumbangan bagi Homestay Kemaman 1, Kemaman 2, dan Gong Badak."
                  : "Comparison of revenue and percentage contribution for Kemaman 1, Kemaman 2, and Gong Badak."}
              </p>
            </div>

            <div className="text-right self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-400 block">{language === "bm" ? "Jumlah Keseluruhan" : "Total Combined"}</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{formatCurrency(totalAllIncome)}</span>
            </div>
          </div>

          {/* Combined Visual Contribution Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span>{language === "bm" ? "Nisbah Sumbangan Pendapatan:" : "Income Contribution Ratio:"}</span>
              <span>100%</span>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex p-1 gap-1 border border-slate-800">
              {propertyStats.map((item, idx) => {
                const sharePct = totalAllIncome > 0 ? (item.revenue / totalAllIncome) * 100 : 33.3;
                const colorClass = idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-sky-400" : "bg-indigo-500";
                return (
                  <div
                    key={item.property.id}
                    style={{ width: `${Math.max(4, sharePct)}%` }}
                    className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                    title={`${item.property.name}: ${formatCurrency(item.revenue)} (${Math.round(sharePct)}%)`}
                  />
                );
              })}
            </div>
            
            {/* Small Legend Under Bar */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400 pt-1">
              {propertyStats.map((item, idx) => {
                const colorDot = idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-sky-400" : "bg-indigo-500";
                const sharePct = totalAllIncome > 0 ? Math.round((item.revenue / totalAllIncome) * 100) : 0;
                return (
                  <span key={item.property.id} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorDot}`} />
                    <span className="text-slate-200">{item.property.name.replace("Homestay Kenangan ", "")}</span>
                    <span className="font-mono text-slate-400">({sharePct}%)</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* 3 Individual Property Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {propertyStats.map((item, idx) => {
              const sharePct = totalAllIncome > 0 ? Math.round((item.revenue / totalAllIncome) * 100) : 0;
              const borderAccent = idx === 0 
                ? "border-amber-500/40 hover:border-amber-400" 
                : idx === 1 
                ? "border-sky-500/40 hover:border-sky-400" 
                : "border-indigo-500/40 hover:border-indigo-400";
              const tagColor = idx === 0 
                ? "bg-amber-950/80 text-amber-300 border-amber-800" 
                : idx === 1 
                ? "bg-sky-950/80 text-sky-300 border-sky-800" 
                : "bg-indigo-950/80 text-indigo-300 border-indigo-800";
              const barColor = idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-sky-400" : "bg-indigo-500";
              const textColor = idx === 0 ? "text-amber-400" : idx === 1 ? "text-sky-400" : "text-indigo-400";

              return (
                <div 
                  key={item.property.id}
                  className={`p-5 rounded-2xl bg-[#111726] border-2 ${borderAccent} transition-all space-y-4 flex flex-col justify-between`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tagColor}`}>
                        {item.isMonthly ? (language === "bm" ? "Sewa Bulanan" : "Monthly") : (language === "bm" ? "Sewa Harian" : "Daily")}
                      </span>
                      <span className="text-xs font-black text-slate-400 font-mono">{sharePct}% {language === "bm" ? "bahagian" : "share"}</span>
                    </div>

                    <h3 className="text-base font-black text-white leading-snug">
                      {item.property.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {item.isMonthly 
                        ? (language === "bm" ? "Rumah Belakang · Sewaan Bilik" : "Back House · Room Rental") 
                        : `${item.property.total_rooms} ${language === "bm" ? "Bilik" : "Rooms"} · ${item.property.address?.split(",")[0] || "Terengganu"}`}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {language === "bm" ? "PENDAPATAN UNIT" : "UNIT REVENUE"}
                      </div>
                      <div className={`text-2xl font-black font-mono mt-0.5 ${textColor}`}>
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>

                    {/* Progress Bar for Share */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(5, sharePct)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>{language === "bm" ? "Sumbangan Hasil" : "Revenue Share"}</span>
                        <span className="font-bold text-slate-200">{sharePct}%</span>
                      </div>
                    </div>

                    {/* Booked Days for this Unit */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{language === "bm" ? "Hari Ditempah:" : "Booked Days:"}</span>
                      <span className="text-white font-bold font-mono">
                        {item.isMonthly 
                          ? (language === "bm" ? "Penuh (Bulanan)" : "Full (Monthly)")
                          : `${item.bookedNights} ${language === "bm" ? "Hari" : "Days"} (${item.bookingsCount} ${language === "bm" ? "tempahan" : "bks"})`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Sumber Tempahan (Booking Sources) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black tracking-widest text-sky-400 uppercase">
                {language === "bm" ? "SALURAN MASUK" : "CHANNELS"}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <BarChart3 className="w-5 h-5 text-sky-400" />
                <span>{language === "bm" ? "Sumber Tempahan" : "Booking Sources"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "bm" 
                  ? "Pecahan platform dan sumber tempahan yang membawa tetamu masuk."
                  : "Breakdown of platforms and booking channels bringing guests."}
              </p>
            </div>

            <div className="text-right self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-400 block">{language === "bm" ? "Jumlah Tempahan" : "Total Bookings"}</span>
              <span className="text-lg font-black text-white font-mono">{monthReservationsCount}</span>
            </div>
          </div>

          {/* Segmented Channel Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
              <span>{language === "bm" ? "Pecahan Saluran:" : "Channel Distribution:"}</span>
              <span>100%</span>
            </div>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex p-1 gap-1 border border-slate-800">
              <div 
                style={{ width: `${Math.max(5, pDirect)}%` }} 
                className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                title={`Direct WhatsApp: ${pDirect}%`} 
              />
              <div 
                style={{ width: `${Math.max(5, pBooking)}%` }} 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                title={`Booking.com: ${pBooking}%`} 
              />
              <div 
                style={{ width: `${Math.max(5, pAirbnb)}%` }} 
                className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                title={`Airbnb: ${pAirbnb}%`} 
              />
            </div>
          </div>

          {/* 3 Clean Channel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Channel 1: Direct WhatsApp */}
            <div className="p-5 rounded-2xl bg-[#111726] border-2 border-emerald-500/40 hover:border-emerald-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  {language === "bm" ? "0% Komisen" : "0% Fee"}
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono">{pDirect}%</span>
              </div>

              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>💬 Direct WhatsApp</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === "bm" ? "Tempahan terus tanpa potongan komisen OTA" : "Direct bookings without OTA commission"}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Jumlah Tempahan:" : "Total Bookings:"}</span>
                <span className="text-white font-black font-mono">{directCount} {language === "bm" ? "tempahan" : "bookings"}</span>
              </div>
            </div>

            {/* Channel 2: Booking.com */}
            <div className="p-5 rounded-2xl bg-[#111726] border-2 border-indigo-500/40 hover:border-indigo-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                  OTA Portal
                </span>
                <span className="text-lg font-black text-indigo-400 font-mono">{pBooking}%</span>
              </div>

              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>🏨 Booking.com</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === "bm" ? "Platform tempahan dalam talian" : "Online travel agency platform"}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Jumlah Tempahan:" : "Total Bookings:"}</span>
                <span className="text-white font-black font-mono">{bookingComCount} {language === "bm" ? "tempahan" : "bookings"}</span>
              </div>
            </div>

            {/* Channel 3: Airbnb */}
            <div className="p-5 rounded-2xl bg-[#111726] border-2 border-amber-500/40 hover:border-amber-400 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800">
                  Global OTA
                </span>
                <span className="text-lg font-black text-amber-400 font-mono">{pAirbnb}%</span>
              </div>

              <div>
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <span>🏠 Airbnb</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {language === "bm" ? "Tempahan antarabangsa & domestik" : "International & domestic bookings"}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{language === "bm" ? "Jumlah Tempahan:" : "Total Bookings:"}</span>
                <span className="text-white font-black font-mono">{airbnbCount} {language === "bm" ? "tempahan" : "bookings"}</span>
              </div>
            </div>
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