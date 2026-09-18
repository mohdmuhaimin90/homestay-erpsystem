"use client";

import { useEffect, useState } from "react";
import { Users, Search, Phone, Mail, MessageCircle, FileText } from "lucide-react";
import { getGuests, getBookings } from "@/lib/supabase";
import { Guest, Booking } from "@/lib/types";
import { generateWhatsAppUrl } from "@/lib/utils";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const [g, b] = await Promise.all([getGuests(), getBookings()]);
      setGuests(g);
      setBookings(b);
    }
    load();
  }, []);

  const filtered = guests.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search)
  );

  const getGuestBookingCount = (guestId: string) => {
    return bookings.filter((b) => b.guest_id === guestId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" /> Direktori & CRM Tetamu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Senarai tetamu berdaftar, rekod tempahan berulang, dan nombor WhatsApp.</p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Jumlah: <span className="font-bold text-slate-900">{guests.length} Tetamu</span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Cari mengikut nama atau no. telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-5">Nama Tetamu</th>
                <th className="p-3.5">Hubungi</th>
                <th className="p-3.5">Kekerapan Tempahan</th>
                <th className="p-3.5">Nota Khusus</th>
                <th className="p-3.5 pr-5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => {
                const count = getGuestBookingCount(g.id);
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
                      <span className="font-semibold text-slate-900">{count} Kali Sewa</span>
                    </td>
                    <td className="p-3.5 text-slate-600 italic">
                      {g.notes || "-"}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <a
                        href={generateWhatsAppUrl(g.phone, `Salam ${g.name}, kami dari pihak pengurusan Homestay. Ada apa-apa yang boleh kami bantu?`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md font-semibold text-[11px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
