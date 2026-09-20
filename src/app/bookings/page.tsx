"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Sparkles,
  ChevronRight
} from "lucide-react";
import { getBookings } from "@/lib/supabase";
import { Booking } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function BookingsPage() {
  const { t, language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const data = await getBookings();
      setBookings(data);
    }
    load();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchesSearch = 
      b.guest?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.guest?.phone?.includes(search) ||
      b.property?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || b.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{language === "bm" ? "Pengurusan Tempahan Menyeluruh" : "Comprehensive Reservation Management"}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("bookings.title")}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t("bookings.subtitle")}</p>
        </div>
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25 hover:opacity-95 hover:-translate-y-0.5 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t("header.new_reservation")}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t("bookings.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 text-xs font-semibold focus:ring-3 focus:ring-indigo-500/15 text-slate-900 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-transparent border-none font-bold text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">{t("bookings.all_statuses")}</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-4 pl-6">{t("bookings.col_guest")}</th>
                <th className="py-4 px-4">{t("bookings.col_property")}</th>
                <th className="py-4 px-4">{t("bookings.col_dates")}</th>
                <th className="py-4 px-4">{t("bookings.col_total")}</th>
                <th className="py-4 px-4">{t("bookings.col_status")}</th>
                <th className="py-4 px-4">{t("bookings.col_channel")}</th>
                <th className="py-4 pr-6 text-right">{t("bookings.col_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    {language === "bm" ? "Tiada rekod tempahan dijumpai." : "No reservation records found."}
                  </td>
                </tr>
              ) : (
                filtered.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="font-extrabold text-slate-900 text-xs">{bk.guest?.name || (language === "bm" ? "Tetamu" : "Guest")}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {bk.guest?.phone || "-"}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-[11px]">
                        {bk.property?.name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{formatDate(bk.check_in)}</div>
                      <div className="text-[11px] text-slate-500">➔ {formatDate(bk.check_out)} ({bk.total_nights} {language === "bm" ? "mlm" : "n"})</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-900">{formatCurrency(bk.total_price)}</div>
                      {bk.total_nights && bk.total_nights > 1 && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatCurrency(Math.round(bk.total_price / bk.total_nights))}/mlm
                        </div>
                      )}
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold mt-1 ${
                        bk.payment_status === "fully_paid"
                          ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
                          : bk.payment_status === "deposit_paid"
                          ? "bg-blue-100/70 text-blue-800 border border-blue-200"
                          : "bg-amber-100/70 text-amber-800 border border-amber-200"
                      }`}>
                        {bk.payment_status === "fully_paid" 
                          ? (language === "bm" ? "Lunas" : "Fully Paid")
                          : bk.payment_status === "deposit_paid" 
                          ? (language === "bm" ? "Deposit" : "Deposit Paid")
                          : (language === "bm" ? "Belum Bayar" : "Unpaid")}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        bk.booking_status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : bk.booking_status === "checked_in"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                          : bk.booking_status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          bk.booking_status === "confirmed" ? "bg-emerald-500" : bk.booking_status === "checked_in" ? "bg-indigo-500" : "bg-amber-500"
                        }`} />
                        {bk.booking_status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize text-slate-600 font-bold text-[11px] px-2.5 py-1 bg-slate-100 rounded-lg">
                        {bk.source.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 pr-6 text-right">
                      {bk.guest?.phone && (
                        <a
                          href={generateWhatsAppUrl(
                            bk.guest.phone,
                            `Salam ${bk.guest.name}, tempahan anda untuk ${bk.property?.name} dari ${formatDate(bk.check_in)} hingga ${formatDate(bk.check_out)} bernilai ${formatCurrency(bk.total_price)} telah disahkan.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] transition shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
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