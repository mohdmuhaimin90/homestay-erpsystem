"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  CalendarCheck, 
  BedDouble, 
  TrendingUp, 
  ArrowUpRight, 
  LogIn, 
  LogOut, 
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  MoreVertical,
  CheckCircle,
  Layers
} from "lucide-react";
import { getBookings, getProperties } from "@/lib/supabase";
import { Booking, Property } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "checkin" | "pending" | "checkout">("all");
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("all");
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
  const pendingPayments = bookings.filter((b) => b.payment_status === "unpaid" || b.booking_status === "pending");

  // Filter based on active tab & property
  const filteredBookings = bookings.filter((b) => {
    if (selectedPropertyFilter !== "all" && b.property_id !== selectedPropertyFilter) {
      return false;
    }
    if (activeTab === "checkin") return b.check_in === todayStr;
    if (activeTab === "checkout") return b.check_out === todayStr;
    if (activeTab === "pending") return b.payment_status === "unpaid" || b.booking_status === "pending";
    return true;
  });

  // Channel Breakdown counts for Donut Chart
  const directCount = bookings.filter((b) => b.source === "direct_whatsapp").length || 1;
  const airbnbCount = bookings.filter((b) => b.source === "airbnb").length || 1;
  const bookingComCount = bookings.filter((b) => b.source === "booking_com" || b.source === "other" || b.source === "agoda").length || 1;
  const totalCount = directCount + airbnbCount + bookingComCount;

  // SVG Donut calculation
  const pDirect = Math.round((directCount / totalCount) * 100);
  const pAirbnb = Math.round((airbnbCount / totalCount) * 100);
  const pBooking = 100 - pDirect - pAirbnb;

  // Circumference = 2 * PI * 40 = 251.2
  const c = 251.2;
  const strokeDirect = (pDirect / 100) * c;
  const strokeAirbnb = (pAirbnb / 100) * c;
  const strokeBooking = (pBooking / 100) * c;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Filter Row (Matching Reference Image) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hello, Mohd Muhaimin
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Homestay Owner & Manager
          </p>
        </div>

        {/* Location & Date Filter Pills (Matching Reference Image) */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Property Dropdown Pill */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs font-bold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-hidden font-bold cursor-pointer text-slate-800 text-xs"
            >
              <option value="all">Semua Unit Homestay</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range Pill */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs font-bold text-slate-700">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>01 Sep 2026 - 30 Sep 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>
      </div>

      {/* Works Overview Split Card (Matching Reference Image) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: 3 Counters (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
            Works Overview
          </h2>

          <div className="grid grid-cols-3 gap-4 pt-1">
            {/* Counter 1: Total Bookings */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Total Bookings</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</div>
                <div className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 mt-0.5">
                  <span>↑ 12% higher</span>
                </div>
              </div>
            </div>

            {/* Counter 2: Total Revenue */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Total Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalRevenue)}</div>
                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-0.5 mt-0.5">
                  <span>Lunas & Deposit</span>
                </div>
              </div>
            </div>

            {/* Counter 3: Occupancy Rate */}
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <BedDouble className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Active Units</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{properties.length}</div>
                <div className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 mt-0.5">
                  <span>100% Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider for Desktop */}
        <div className="hidden lg:block lg:col-span-1 h-28 w-[1px] bg-slate-200 mx-auto" />

        {/* Right Side: Donut Chart matching Reference Image (4 cols) */}
        <div className="lg:col-span-4 flex items-center justify-between sm:justify-around gap-4">
          {/* Circular SVG Donut */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
              {/* Background circle */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="16" />
              
              {/* Direct WhatsApp (Blue) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#0284c7"
                strokeWidth="16"
                strokeDasharray={`${strokeDirect} ${c}`}
                strokeDashoffset="0"
              />
              
              {/* Airbnb (Amber / Orange) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="16"
                strokeDasharray={`${strokeAirbnb} ${c}`}
                strokeDashoffset={`-${strokeDirect}`}
              />
              
              {/* Booking.com (Dark Slate / Charcoal) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#0f172a"
                strokeWidth="16"
                strokeDasharray={`${strokeBooking} ${c}`}
                strokeDashoffset={`-${strokeDirect + strokeAirbnb}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xs font-black text-slate-900 leading-none">{bookings.length}</span>
              <span className="text-[9px] font-bold text-slate-400">Total</span>
            </div>
          </div>

          {/* Donut Legend (Matching Reference Image) */}
          <div className="space-y-2 text-xs">
            <h3 className="font-extrabold text-slate-900 text-xs mb-1">Booking Channels</h3>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" />
              <span className="text-slate-600 font-semibold text-[11px]">Direct WA ({pDirect}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
              <span className="text-slate-600 font-semibold text-[11px]">Airbnb ({pAirbnb}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0f172a]" />
              <span className="text-slate-600 font-semibold text-[11px]">Booking.com ({pBooking}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: My Tasks / Bookings Table (Matching Reference Image) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            My Tasks & Bookings
          </h2>

          {/* Tabs with Counts (Matching Reference Image) */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-6 text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-2.5 font-bold transition relative ${
                  activeTab === "all"
                    ? "text-blue-600 border-b-2 border-blue-600 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua Tempahan ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab("checkin")}
                className={`pb-2.5 font-bold transition relative ${
                  activeTab === "checkin"
                    ? "text-blue-600 border-b-2 border-blue-600 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Check-in Hari Ini ({todayCheckIns.length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`pb-2.5 font-bold transition relative ${
                  activeTab === "pending"
                    ? "text-blue-600 border-b-2 border-blue-600 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Menunggu Bayaran ({pendingPayments.length})
              </button>
              <button
                onClick={() => setActiveTab("checkout")}
                className={`pb-2.5 font-bold transition relative ${
                  activeTab === "checkout"
                    ? "text-blue-600 border-b-2 border-blue-600 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Check-out ({todayCheckOuts.length})
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-400">
              Menunjukkan {filteredBookings.length} rekod
            </span>
          </div>

          {/* Filter Bar with Blue Filter Button (Matching Reference Image) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 text-xs font-bold text-slate-700">
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-bold cursor-pointer focus:outline-hidden"
              >
                <option value="all">Semua Kategori / Unit</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span>Status: Aktif</span>
              <span className="text-slate-400">×</span>
            </div>

            <button
              type="button"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Filter
            </button>
          </div>
        </div>

        {/* Data Table (Matching Reference Image Structure) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 pl-6 w-10">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="py-3.5 px-3 w-12">Sl. No.</th>
                <th className="py-3.5 px-4">Nama Tetamu</th>
                <th className="py-3.5 px-4">Unit Homestay</th>
                <th className="py-3.5 px-4">Tarikh Tempahan</th>
                <th className="py-3.5 px-4">Kewangan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tindakan</th>
                <th className="py-3.5 pr-6 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Tiada rekod tempahan untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((bk, index) => (
                  <tr key={bk.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 pl-6">
                      <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="py-4 px-3 font-semibold text-slate-400">{index + 1}</td>
                    <td className="py-4 px-4">
                      <div className="font-extrabold text-slate-900 text-xs">{bk.guest?.name || "Tetamu"}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {bk.guest?.phone || "-"}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {bk.property?.name || "Unit"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{formatDate(bk.check_in)}</div>
                      <div className="text-[11px] text-slate-500">➔ {formatDate(bk.check_out)} ({bk.total_nights} mlm)</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-900">{formatCurrency(bk.total_price)}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {bk.payment_status === "fully_paid" ? "Lunas" : "Deposit"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        bk.booking_status === "confirmed"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : bk.booking_status === "checked_in"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : bk.booking_status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {bk.booking_status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {bk.guest?.phone ? (
                        <a
                          href={generateWhatsAppUrl(
                            bk.guest.phone,
                            `Salam ${bk.guest.name}, tempahan anda untuk ${bk.property?.name} telah disahkan!`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 pr-6 text-center text-slate-400 hover:text-slate-700 cursor-pointer">
                      <MoreVertical className="w-4 h-4 mx-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}