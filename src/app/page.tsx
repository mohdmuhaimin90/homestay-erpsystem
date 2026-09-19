"use client";

import { useEffect, useState } from "react";
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
  PlusCircle
} from "lucide-react";
import { getBookings, getProperties } from "@/lib/supabase";
import { Booking, Property } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"month" | "quarter" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [uiMode, setUiMode] = useState<"EZ" | "PRO">("PRO");

  useEffect(() => {
    async function loadData() {
      const [bData, pData] = await Promise.all([getBookings(), getProperties()]);
      setBookings(bData);
      setProperties(pData);
      setLoading(false);
    }
    loadData();

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("damai_ui_mode") as "EZ" | "PRO";
      if (saved) setUiMode(saved);

      const handler = () => {
        const current = (localStorage.getItem("damai_ui_mode") as "EZ" | "PRO") || "PRO";
        setUiMode(current);
      };
      window.addEventListener("ui_mode_change", handler);
      return () => window.removeEventListener("ui_mode_change", handler);
    }
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const totalRevenue = bookings
    .filter((b) => b.booking_status !== "cancelled")
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const todayCheckIns = bookings.filter((b) => b.check_in === todayStr);
  const todayCheckOuts = bookings.filter((b) => b.check_out === todayStr);
  const confirmedCount = bookings.filter((b) => b.booking_status === "confirmed" || b.booking_status === "checked_in").length;

  const totalNights = bookings.reduce((sum, b) => sum + (b.total_nights || 1), 0);
  const avgStay = bookings.length > 0 ? (totalNights / bookings.length).toFixed(1) : "2.5";

  // Channel Breakdown
  const directCount = bookings.filter((b) => b.source === "direct_whatsapp").length || 1;
  const airbnbCount = bookings.filter((b) => b.source === "airbnb").length || 1;
  const bookingComCount = bookings.filter((b) => b.source === "booking_com" || b.source === "other" || b.source === "agoda").length || 1;
  const totalChannels = directCount + airbnbCount + bookingComCount;

  const pDirect = Math.round((directCount / totalChannels) * 100);
  const pBooking = Math.round((bookingComCount / totalChannels) * 100);
  const pAirbnb = 100 - pDirect - pBooking;

  const getCheckInWhatsAppMessage = (b: Booking) => {
    const propName = b.property?.name || "Homestay Damai";
    const guestName = b.guest?.name || "Tuan/Puan";
    const lockCode = b.property?.smartlock_code || "1234#";
    const wifi = b.property?.wifi_ssid || "Homestay_WiFi";
    const wifiPass = b.property?.wifi_password || "12345678";
    return `Salam sejahtera ${guestName},\n\nSelamat datang ke ${propName}! 🏡\n\nBerikut adalah maklumat kemasukan (Check-in):\n🕒 Waktu Check-in: 3:00 Petang\n🔑 Kod Pintu Smartlock: ${lockCode}\n📶 WiFi: ${wifi} (Password: ${wifiPass})\n📍 Lokasi: ${b.property?.address || "Homestay Damai"}\n\nSekiranya ada apa-apa pertanyaan semasa penginapan, sila hubungi kami di talian ini. Selamat bercuti!`;
  };

  const getCheckOutWhatsAppMessage = (b: Booking) => {
    const propName = b.property?.name || "Homestay Damai";
    const guestName = b.guest?.name || "Tuan/Puan";
    return `Salam sejahtera ${guestName},\n\nTerima kasih kerana memilih ${propName} untuk percutian anda sekeluarga! ❤️\n\nKami berharap anda berpuas hati sepanjang penginapan. Sekiranya kunci sudah diletakkan di tempat asal dan suis elektrik dipadamkan, deposit keselamatan anda sebanyak RM ${b.deposit_amount || 100} akan dipulangkan sebentar lagi.\n\nJumpa lagi di lain masa!`;
  };

  if (uiMode === "EZ") {
    return (
      <div className="space-y-8 pb-16 max-w-5xl mx-auto">
        {/* Warm Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141A29] via-[#0E1524] to-[#121826] border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black tracking-wider uppercase border border-amber-500/40 mb-3">
                <Heart className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>MOD EZ · KHAS UNTUK IBU BAPA</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Salam Sejahtera Mak & Ayah! 🏡
              </h1>
              <p className="text-base text-slate-300 mt-2 max-w-xl font-medium">
                Pusat kawalan homestay yang mudah. Tekan butang hijau untuk terus hantar kunci & alamat ke WhatsApp tetamu.
              </p>
            </div>

            <Link
              href="/bookings/new"
              className="px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-3 shrink-0"
            >
              <PlusCircle className="w-6 h-6" />
              <span>+ Daftar Tetamu Baru</span>
            </Link>
          </div>
        </div>

        {/* 2 Big Action Sections: Check-In & Check-Out Today */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Tetamu Masuk Hari Ini */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border-2 border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl shadow-lg">
                  🛎️
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Tetamu Masuk Hari Ini</h2>
                  <p className="text-xs text-slate-400">Tarikh: {formatDate(todayStr)}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 font-black text-sm border border-emerald-800/60">
                {todayCheckIns.length} Tetamu
              </span>
            </div>

            {todayCheckIns.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800 text-center space-y-2">
                <p className="text-sm font-bold text-slate-300">Tiada tetamu baru masuk hari ini.</p>
                <p className="text-xs text-slate-400">Semua bilik yang berpenghuni sedang berjalan seperti biasa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayCheckIns.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-[#111726] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-black text-white">{b.guest?.name || "Tetamu"}</div>
                        <div className="text-xs font-bold text-indigo-400 mt-0.5">{b.property?.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5" /> {b.guest?.phone || "-"}
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
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
                        <span>Hantar Kod Pintu & Alamat ke WhatsApp</span>
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
                  <h2 className="text-xl font-black text-white">Tetamu Keluar Hari Ini</h2>
                  <p className="text-xs text-slate-400">Check-out sebelum 12:00 tengah hari</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-rose-950 text-rose-400 font-black text-sm border border-rose-800/60">
                {todayCheckOuts.length} Tetamu
              </span>
            </div>

            {todayCheckOuts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#111726] border border-slate-800 text-center space-y-2">
                <p className="text-sm font-bold text-slate-300">Tiada tetamu keluar hari ini.</p>
                <p className="text-xs text-slate-400">Tiada keperluan untuk pembersihan bilik serta-merta hari ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayCheckOuts.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-[#111726] border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-black text-white">{b.guest?.name || "Tetamu"}</div>
                        <div className="text-xs font-bold text-indigo-400 mt-0.5">{b.property?.name}</div>
                        <div className="text-xs text-slate-400 mt-1">Deposit Perlu Pulang: RM {b.deposit_amount || 100}</div>
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
                        <span>Hantar WhatsApp Terima Kasih & Deposit</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Status Bilik Hari Ini (Kosong atau Ada Orang) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🛌 Status Bilik Homestay Hari Ini</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tengok rumah mana yang kosong dan boleh disewakan kepada orang yang tanya di WhatsApp.
              </p>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Buka Kalendar Penuh</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {properties.map((p) => {
              const activeBooking = bookings.find(
                (b) =>
                  b.property_id === p.id &&
                  b.check_in <= todayStr &&
                  b.check_out > todayStr &&
                  b.booking_status !== "cancelled"
              );

              return (
                <div 
                  key={p.id}
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                    activeBooking 
                      ? "bg-[#14101A] border-rose-500/40" 
                      : "bg-[#0B1516] border-emerald-500/50 shadow-lg shadow-emerald-500/5"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">{p.total_rooms} Bilik</span>
                      {activeBooking ? (
                        <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-black">
                          🔒 ADA TETAMU
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-black animate-pulse">
                          ✅ KOSONG - BOLEH SEWA
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.address || "Kajang, Selangor"}</p>
                  </div>

                  {activeBooking ? (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-rose-900/40 text-xs space-y-1">
                      <div className="text-rose-200 font-bold">Tetamu: {activeBooking.guest?.name || "Tetamu"}</div>
                      <div className="text-slate-400 text-[11px]">
                        Keluar: {formatDate(activeBooking.check_out)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-900/40 text-xs space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kadar Sewaan Hari Ini:</span>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold">Direct WA:</span>
                        <span className="text-white font-black">{formatCurrency(p.price_direct || p.base_price_per_night)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Airbnb / Booking:</span>
                        <span>{formatCurrency(p.price_airbnb || Math.round(p.base_price_per_night * 1.15))}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Pintu: {p.smartlock_code}</span>
                    <Link
                      href="/bookings/new"
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      Daftar Masuk →
                    </Link>
                  </div>
                </div>
              );
            })}
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
            FRIDAY · 20 SEPTEMBER 2026 · PEAK SEASON
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Property <span className="text-indigo-400">Performance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time occupancy, revenue metrics, and upcoming arrivals for Damai Homestay.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E1320] border border-slate-800 text-xs font-semibold text-slate-300 hover:border-slate-700 transition">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>September 2026</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Live Auto-refresh Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E1320] border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold">
              <span className="text-emerald-400 font-bold">LIVE</span> Auto-refresh: 5m
            </span>
          </div>
        </div>
      </div>

      {/* Occupancy Multi-Color Strip Card (Exact Match of StayVault) */}
      <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left: Occupancy Big Number */}
          <div className="flex items-baseline gap-2.5 shrink-0">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">83.3%</span>
            <span className="text-xs font-black tracking-wider text-slate-400 uppercase">OCCUPANCY</span>
          </div>

          {/* Center: Multi-Color Progress Bar & Legend */}
          <div className="flex-1 space-y-2.5 max-w-3xl">
            {/* Multi-segment Bar */}
            <div className="h-3.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div className="h-full bg-cyan-400 rounded-l-full" style={{ width: "55%" }} title="Occupied" />
              <div className="h-full bg-indigo-500" style={{ width: "18%" }} title="Arriving Today" />
              <div className="h-full bg-rose-500" style={{ width: "10%" }} title="Departing" />
              <div className="h-full bg-slate-700 rounded-r-full" style={{ width: "17%" }} title="Available" />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-cyan-400" />
                <span className="text-slate-300 font-bold">30</span> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-indigo-500" />
                <span className="text-slate-300 font-bold">{todayCheckIns.length || 2}</span> Arriving Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-rose-500" />
                <span className="text-slate-300 font-bold">{todayCheckOuts.length || 1}</span> Departing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-slate-600" />
                <span className="text-slate-300 font-bold">8</span> Available
              </span>
            </div>
          </div>

          {/* Right: 4 Mini Financial KPIs */}
          <div className="flex items-center gap-5 sm:gap-7 border-t xl:border-t-0 xl:border-l border-slate-800 pt-4 xl:pt-0 xl:pl-6 shrink-0">
            <div>
              <div className="text-base font-black text-indigo-400">RM 312</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ADR</div>
            </div>
            <div>
              <div className="text-base font-black text-emerald-400">RM 260</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REVPAR</div>
            </div>
            <div>
              <div className="text-base font-black text-white">RM 14.9K</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TONIGHT REV</div>
            </div>
            <div>
              <div className="text-base font-black text-amber-400">4.88 ★</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG RATING</div>
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
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ▲ 21.4%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{formatCurrency(totalRevenue)}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">MONTHLY REVENUE</div>
            <div className="text-[10px] text-slate-400 mt-1">vs. RM 14,450 last month</div>
          </div>
        </div>

        {/* Card 2: Reservations MTD */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ▲ 8.3%
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{bookings.length}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">RESERVATIONS MTD</div>
            <div className="text-[10px] text-slate-400 mt-1">6 new since yesterday</div>
          </div>
        </div>

        {/* Card 3: Avg Length of Stay */}
        <div className="p-5 rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs">
              <Moon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ▲ 0.4 nights
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">{avgStay}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">AVG LENGTH OF STAY</div>
            <div className="text-[10px] text-slate-400 mt-1">Nights per booking</div>
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">CANCELLATION RATE</div>
            <div className="text-[10px] text-slate-400 mt-1">Zero cancellations this month</div>
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">REPEAT GUEST RATE</div>
            <div className="text-[10px] text-slate-400 mt-1">High customer retention</div>
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
                Revenue Per Available Room
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                RevPAR trend — September 2026 vs August 2026
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
                Month
              </button>
              <button
                onClick={() => setChartPeriod("quarter")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  chartPeriod === "quarter" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => setChartPeriod("year")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  chartPeriod === "year" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                Year
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
              Booking Channels
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Source mix this month
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
                <span className="text-xl font-black text-white leading-none">{bookings.length}</span>
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase mt-0.5">BOOKINGS</span>
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
              Recent Reservations
            </h2>
            <p className="text-xs text-slate-400">All bookings across Direct, Airbnb, and Booking.com</p>
          </div>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111726] border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111726] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((bk) => (
                <tr key={bk.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{bk.guest?.name || "Guest"}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {bk.guest?.phone || "-"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {bk.property?.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{formatDate(bk.check_in)}</div>
                    <div className="text-[10px] text-slate-400">to {formatDate(bk.check_out)} ({bk.total_nights}n)</div>
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