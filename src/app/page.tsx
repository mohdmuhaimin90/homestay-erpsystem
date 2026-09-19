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
  MoreVertical
} from "lucide-react";
import { getBookings, getProperties } from "@/lib/supabase";
import { Booking, Property } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"month" | "quarter" | "year">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [bData, pData] = await Promise.all([getBookings(), getProperties()]);
      setBookings(bData);
      setProperties(pData);
      setLoading(false);
    }
    loadData();
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