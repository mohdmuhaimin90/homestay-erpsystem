"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Calendar, 
  Building, 
  Phone, 
  MessageCircle, 
  X,
  MapPin,
  Sparkles,
  Layers,
  FileUp
} from "lucide-react";
import { getBookings, getProperties } from "@/lib/supabase";
import { Booking, Property } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";

export default function CalendarPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    async function load() {
      const [p, b] = await Promise.all([getProperties(), getBookings()]);
      setProperties(p);
      setBookings(b);
    }
    load();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("ms-MY", { month: "long", year: "numeric" });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getBookingForDay = (propertyId: string, day: number) => {
    const formattedDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.find((b) => {
      if (b.property_id !== propertyId || b.booking_status === "cancelled") return false;
      return formattedDayStr >= b.check_in && formattedDayStr < b.check_out;
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Month Navigator (StayVault Luxury Dark Theme) */}
      <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-indigo-800/60 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>MATRIKS KETERSEDIAAN HOMESTAY · KEMAMAN & GONG BADAK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Kalendar Tempahan & <span className="text-indigo-400">Jadual Bilik</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Semak tarikh yang telah ditempah dan kosong dari Januari hingga Disember untuk elak *double booking*.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Navigator Pill */}
          <div className="flex items-center bg-[#111726] rounded-xl p-1 border border-slate-800 shadow-md">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-[#182035] rounded-lg text-slate-400 hover:text-white transition"
              title="Bulan Lepas"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-black text-white capitalize min-w-[150px] text-center font-mono">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-[#182035] rounded-lg text-slate-400 hover:text-white transition"
              title="Bulan Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/import"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#111726] hover:bg-slate-800 text-indigo-300 border border-indigo-800/50 rounded-xl text-xs font-bold transition"
            title="Import Data Planner"
          >
            <FileUp className="w-4 h-4 text-indigo-400" />
            <span>Import Planner</span>
          </Link>

          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tempahan Baru</span>
          </Link>
        </div>
      </div>

      {/* Status Legend (No green / no purple - uses Cyan, Indigo, Amber, Slate) */}
      <div className="flex flex-wrap items-center gap-6 text-xs bg-[#0D121D] px-6 py-3.5 rounded-2xl border border-slate-800 shadow-md">
        <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">Petunjuk Warna:</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-indigo-600 shadow-xs"></span>
          <span className="text-slate-300 font-bold text-xs">Direct WhatsApp (Confirmed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-rose-500 shadow-xs"></span>
          <span className="text-slate-300 font-bold text-xs">Airbnb</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-cyan-400 shadow-xs"></span>
          <span className="text-slate-300 font-bold text-xs">Booking.com</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700 shadow-xs"></span>
          <span className="text-slate-400 font-medium text-xs">Kosong (Available)</span>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#080B11] text-white">
              <th className="p-3.5 text-left font-black w-56 sticky left-0 bg-[#080B11] z-20 border-r border-slate-800">
                Unit Homestay
              </th>
              {daysArray.map((day) => {
                const dateObj = new Date(year, month, day);
                const dayName = dateObj.toLocaleDateString("ms-MY", { weekday: "narrow" });
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                return (
                  <th
                    key={day}
                    className={`p-2 text-center min-w-[38px] font-extrabold border-r border-slate-800/80 ${
                      isWeekend ? "bg-slate-900/90 text-amber-400" : "text-slate-400"
                    }`}
                  >
                    <div className="text-xs font-mono">{day}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{dayName}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-800/30 transition">
                <td className="p-3.5 font-black text-white sticky left-0 bg-[#0D121D] z-10 border-r border-slate-800 shadow-md">
                  <div className="truncate max-w-[180px] font-bold text-xs text-white" title={prop.name}>
                    {prop.name}
                  </div>
                  <div className="text-[11px] text-indigo-400 font-mono mt-0.5">
                    {formatCurrency(prop.price_direct || prop.base_price_per_night)}
                  </div>
                </td>
                {daysArray.map((day) => {
                  const booking = getBookingForDay(prop.id, day);
                  const isStart = booking && booking.check_in === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  return (
                    <td
                      key={day}
                      onClick={() => booking && setSelectedBooking(booking)}
                      className={`p-1 text-center border-r border-slate-800/60 transition h-14 ${
                        booking ? "cursor-pointer" : ""
                      }`}
                    >
                      {booking ? (
                        <div
                          className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-[10px] font-black text-white shadow-md p-1 transition-all hover:scale-105 ${
                            booking.source === "airbnb"
                              ? "bg-rose-600 text-white shadow-rose-900/30"
                              : booking.source === "booking_com"
                              ? "bg-cyan-600 text-white shadow-cyan-900/30"
                              : "bg-indigo-600 text-white shadow-indigo-900/30"
                          }`}
                        >
                          {isStart ? (
                            <span className="truncate w-full text-center leading-tight">
                              {booking.guest?.name?.split(" ")[0] || "Guest"}
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg hover:bg-slate-800/50 flex items-center justify-center text-slate-700 transition">
                          ·
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D121D] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" /> Butiran Tempahan
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#111726] p-4 rounded-xl border border-slate-800">
                <div className="font-black text-white text-sm">{selectedBooking.property?.name || "Homestay"}</div>
                <div className="text-slate-400 mt-1 font-semibold">
                  📅 {formatDate(selectedBooking.check_in)} ➔ {formatDate(selectedBooking.check_out)} ({selectedBooking.total_nights} Malam)
                </div>
              </div>

              <div className="space-y-2.5 p-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tetamu:</span>
                  <span className="font-bold text-white">{selectedBooking.guest?.name} ({selectedBooking.guest?.phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jumlah Harga:</span>
                  <span className="font-black text-emerald-400">{formatCurrency(selectedBooking.total_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deposit:</span>
                  <span className="font-black text-indigo-300">{formatCurrency(selectedBooking.deposit_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Bayaran:</span>
                  <span className="font-bold uppercase text-slate-200">{selectedBooking.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Saluran Tempahan:</span>
                  <span className="font-bold text-cyan-400 uppercase">{selectedBooking.source}</span>
                </div>
                {selectedBooking.notes && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Catatan: {selectedBooking.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              {selectedBooking.guest?.phone && (
                <a
                  href={generateWhatsAppUrl(selectedBooking.guest.phone, `Salam ${selectedBooking.guest.name}, tempahan anda telah disahkan!`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}