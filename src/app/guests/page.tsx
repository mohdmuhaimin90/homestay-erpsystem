"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Search, Phone, Mail, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getGuests, getBookings } from "@/lib/supabase";
import { Guest, Booking } from "@/lib/types";
import { generateWhatsAppUrl } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { TableSkeleton } from "@/components/Skeleton";

export default function GuestsPage() {
  const { language } = useLanguage();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [g, b] = await Promise.all([getGuests(), getBookings()]);
      setGuests(g);
      setBookings(b);
      setLoading(false);
    }
    load();
  }, []);

  // Pre-calculate booking counts using a single pass O(M) Map to eliminate N+1 recalculations
  const bookingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookings) {
      if (b.guest_id) {
        counts.set(b.guest_id, (counts.get(b.guest_id) || 0) + 1);
      }
    }
    return counts;
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return guests;
    return guests.filter((g) =>
      g.name.toLowerCase().includes(q) || g.phone.includes(q)
    );
  }, [guests, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> {language === "bm" ? "Direktori & CRM Tetamu" : "Guests Directory & CRM"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "bm" ? "Senarai tetamu berdaftar, rekod tempahan berulang, dan nombor WhatsApp." : "List of registered guests, repeat stay records, and WhatsApp contacts."}
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {language === "bm" ? "Jumlah:" : "Total:"} <span className="font-bold text-slate-900">{guests.length} {language === "bm" ? "Tetamu" : "Guests"}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder={language === "bm" ? "Cari mengikut nama atau no. telefon..." : "Search by name or phone number..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">{language === "bm" ? "Nama Tetamu" : "Guest Name"}</th>
                  <th className="p-3.5">{language === "bm" ? "Hubungi" : "Contact"}</th>
                  <th className="p-3.5">{language === "bm" ? "Kekerapan Tempahan" : "Stay Frequency"}</th>
                  <th className="p-3.5">{language === "bm" ? "Nota Khusus" : "Special Notes"}</th>
                  <th className="p-3.5 pr-5 text-right">{language === "bm" ? "Tindakan" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      {language === "bm" ? "Tiada tetamu dijumpai." : "No guests found."}
                    </td>
                  </tr>
                ) : (
                  paginatedGuests.map((g) => {
                    const count = bookingCounts.get(g.id) || 0;
                    return (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-5 font-bold text-slate-900">
                          {g.name}
                          {count > 1 && (
                            <span className="ml-2 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">
                              Repeat Guest ⭐
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {g.phone}
                          </div>
                          {g.email && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {g.email}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900">{count} {language === "bm" ? "Kali Sewa" : "Stays"}</span>
                        </td>
                        <td className="p-3.5 text-slate-600 italic">
                          {g.notes || "-"}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          <a
                            href={generateWhatsAppUrl(
                              g.phone,
                              language === "bm" 
                                ? `Salam ${g.name}, kami dari pihak pengurusan Homestay Kenangan. Ada apa-apa yang boleh kami bantu?`
                                : `Hello ${g.name}, we are from Homestay Kenangan management. Is there anything we can assist you with?`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md font-semibold text-[11px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filtered.length > pageSize && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500">
                {language === "bm"
                  ? `Menunjukkan ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filtered.length)} daripada ${filtered.length} tetamu`
                  : `Showing ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} guests`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  {language === "bm" ? "Sebelumnya" : "Previous"}
                </button>
                <span className="px-3 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  {language === "bm" ? "Seterusnya" : "Next"}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
