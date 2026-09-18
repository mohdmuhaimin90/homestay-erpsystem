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
  MapPin
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
    <div className="space-y-6 pb-12">
      {/* Header & Month Navigator */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Kalendar Tempahan & Ketersediaan Bilik</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Paparan matriks ketersediaan unit untuk mengelakkan pertindihan tempahan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-xs">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Bulan Lepas"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-xs font-black text-slate-800 capitalize min-w-[140px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Bulan Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tempahan Baru</span>
          </Link>
        </div>
      </div>

      {/* Status Legend (Black, Electric Blue, Amber, Cyan) - Strictly No Green / Purple */}
      <div className="flex flex-wrap items-center gap-5 text-xs bg-white px-5 py-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <span className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Status:</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-blue-600 shadow-xs"></span>
          <span className="text-slate-700 font-bold text-xs">Disahkan (Confirmed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-sky-500 shadow-xs"></span>
          <span className="text-slate-700 font-bold text-xs">Checked-In</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-amber-500 shadow-xs"></span>
          <span className="text-slate-700 font-bold text-xs">Menunggu (Pending)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300 shadow-xs"></span>
          <span className="text-slate-500 font-medium text-xs">Kosong (Available)</span>
        </div>
      </div>

      {/* Grid Matrix Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#0A0D14] text-white">
              <th className="p-3.5 text-left font-black w-52 sticky left-0 bg-[#0A0D14] z-20 border-r border-slate-800">
                Unit Homestay
              </th>
              {daysArray.map((day) => {
                const dateObj = new Date(year, month, day);
                const dayName = dateObj.toLocaleDateString("ms-MY", { weekday: "narrow" });
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                return (
                  <th
                    key={day}
                    className={`p-2 text-center min-w-[36px] font-extrabold border-r border-slate-800/80 ${
                      isWeekend ? "bg-slate-800 text-amber-400" : "text-slate-300"
                    }`}
                  >
                    <div className="text-xs">{day}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{dayName}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-50/70 transition">
                <td className="p-3.5 font-black text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-xs">
                  <div className="truncate max-w-[180px] font-bold text-xs" title={prop.name}>{prop.name}</div>
                  <div className="text-[11px] text-blue-600 font-black mt-0.5">{formatCurrency(prop.base_price_per_night)}/mlm</div>
                </td>
                {daysArray.map((day) => {
                  const booking = getBookingForDay(prop.id, day);
                  const isStart = booking && booking.check_in === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  return (
                    <td
                      key={day}
                      onClick={() => booking && setSelectedBooking(booking)}
                      className={`p-1 text-center border-r border-slate-100 transition h-14 ${
                        booking ? "cursor-pointer" : ""
                      }`}
                    >
                      {booking ? (
                        <div
                          className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-[10px] font-black text-white shadow-xs p-1 transition-all hover:opacity-90 ${
                            booking.booking_status === "confirmed"
                              ? "bg-blue-600"
                              : booking.booking_status === "checked_in"
                              ? "bg-sky-500"
                              : "bg-amber-500"
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
                        <div className="w-full h-full rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-300 transition">
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

      {/* Selected Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" /> Butiran Tempahan
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                <div className="font-black text-slate-900 text-sm">{selectedBooking.property?.name || "Homestay"}</div>
                <div className="text-slate-600 mt-1 font-semibold">
                  📅 {formatDate(selectedBooking.check_in)} ➔ {formatDate(selectedBooking.check_out)} ({selectedBooking.total_nights} Malam)
                </div>
              </div>

              <div className="space-y-2 p-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tetamu:</span>
                  <span className="font-bold text-slate-900">{selectedBooking.guest?.name} ({selectedBooking.guest?.phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah Harga:</span>
                  <span className="font-black text-slate-900">{formatCurrency(selectedBooking.total_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit:</span>
                  <span className="font-black text-blue-600">{formatCurrency(selectedBooking.deposit_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Bayaran:</span>
                  <span className="font-bold uppercase text-slate-800">{selectedBooking.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Saluran:</span>
                  <span className="font-bold text-blue-600 uppercase">{selectedBooking.source}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              {selectedBooking.guest?.phone && (
                <a
                  href={generateWhatsAppUrl(selectedBooking.guest.phone, `Salam ${selectedBooking.guest.name}, tempahan anda telah disahkan!`)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
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