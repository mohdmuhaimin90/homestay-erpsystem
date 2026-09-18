"use client";

import { useEffect, useState } from "react";
import { 
  PlusCircle, 
  Home, 
  Key, 
  Wifi, 
  MapPin, 
  RefreshCw, 
  CalendarSync, 
  Copy, 
  Check, 
  Sparkles,
  Users,
  DollarSign
} from "lucide-react";
import { getProperties, saveProperty } from "@/lib/supabase";
import { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedPropId, setCopiedPropId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [basePrice, setBasePrice] = useState(250);
  const [cleaningFee, setCleaningFee] = useState(50);
  const [deposit, setDeposit] = useState(100);
  const [rooms, setRooms] = useState(3);
  const [maxGuests, setMaxGuests] = useState(8);
  const [smartlock, setSmartlock] = useState("1234#");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [airbnbIcal, setAirbnbIcal] = useState("");
  const [bookingcomIcal, setBookingcomIcal] = useState("");

  const loadData = async () => {
    const data = await getProperties();
    setProperties(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync-ical", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult(`✅ Selesai! Sebanyak ${data.importedCount} tempahan baru berjaya diselaraskan dari Airbnb/Booking.com.`);
        loadData();
      } else {
        setSyncResult(`Ralat: ${data.error || "Gagal menyelaraskan iCal."}`);
      }
    } catch (err: any) {
      setSyncResult(`Ralat penyelarasan: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const copyIcalExportUrl = (propId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://erphomestay.local";
    const url = `${origin}/api/ical/${propId}`;
    navigator.clipboard.writeText(url);
    setCopiedPropId(propId);
    setTimeout(() => setCopiedPropId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await saveProperty({
      name,
      address,
      base_price_per_night: Number(basePrice),
      cleaning_fee: Number(cleaningFee),
      deposit_amount: Number(deposit),
      total_rooms: Number(rooms),
      max_guests: Number(maxGuests),
      smartlock_code: smartlock,
      wifi_ssid: wifiSsid,
      wifi_password: wifiPass,
      airbnb_ical_url: airbnbIcal,
      bookingcom_ical_url: bookingcomIcal,
      status: "active",
    });

    setShowModal(false);
    setName("");
    setAddress("");
    setAirbnbIcal("");
    setBookingcomIcal("");
    loadData();
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200/60 mb-2">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Pengurusan Premis & Saluran iCal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Unit Homestay & Penyelarasan Kalendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kawal kadar sewaan, kod smartlock, dan pautan penyelarasan 2-hala kalendar (Airbnb & Booking.com).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black shadow-md transition-all hover:-translate-y-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{syncing ? "Sedang Sync..." : "Sync Airbnb & Booking"}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Unit</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          syncResult.startsWith("✅") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {syncResult}
        </div>
      )}

      {/* Properties Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full">
                  {p.status}
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-2 tracking-tight">{p.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{p.address || "Lokasi belum ditetapkan"}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl grid grid-cols-2 gap-3 text-xs border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Harga / Malam</span>
                  <div className="font-black text-slate-900 text-base mt-0.5">{formatCurrency(p.base_price_per_night)}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Kapasiti</span>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{p.total_rooms} Bilik ({p.max_guests} Pax)</div>
                </div>
              </div>

              {/* Passcode & Wifi */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold"><Key className="w-3.5 h-3.5 text-amber-500" /> Smartlock:</span>
                  <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60">{p.smartlock_code || "1234#"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-bold"><Wifi className="w-3.5 h-3.5 text-blue-500" /> WiFi SSID:</span>
                  <span className="font-semibold text-slate-800">{p.wifi_ssid || "-"}</span>
                </div>
              </div>

              {/* iCal Link Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5 text-emerald-400 text-xs">
                    <CalendarSync className="w-4 h-4" /> iCal Export Feed (Airbnb / Booking)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Tampal pautan ini di Airbnb & Booking.com untuk sekat tarikh automatik:
                </p>
                <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl text-[11px] font-mono border border-slate-700/60">
                  <span className="truncate max-w-[190px] text-slate-300">/api/ical/{p.id}</span>
                  <button
                    type="button"
                    onClick={() => copyIcalExportUrl(p.id)}
                    className="text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 text-[11px]"
                  >
                    {copiedPropId === p.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPropId === p.id ? "Disalin!" : "Salin Link"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[10px] font-mono">ID: {p.id.slice(0, 8)}</span>
              <span className="text-[11px] text-indigo-600 font-black">2-Way Sync Active ⚡</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg tracking-tight">Tambah Unit Homestay Baru</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Unit *</label>
                <input
                  type="text"
                  placeholder="Contoh: Villa Anggun 3 Bilik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-slate-900 font-bold focus:ring-3 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Penuh</label>
                <input
                  type="text"
                  placeholder="No 123, Jalan Kenanga..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-slate-900 font-medium focus:ring-3 focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga / Malam (RM) *</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Caj Cuci (RM)</label>
                  <input
                    type="number"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50/90 rounded-2xl border border-slate-200 text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Inbound iCal Feed */}
              <div className="p-4 bg-slate-50/80 rounded-2xl space-y-3 border border-slate-200/80">
                <span className="font-extrabold text-slate-800 block text-xs">Penyelarasan Kalendar Masuk (Import)</span>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Airbnb iCal Export URL</label>
                  <input
                    type="url"
                    value={airbnbIcal}
                    onChange={(e) => setAirbnbIcal(e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Booking.com iCal Export URL</label>
                  <input
                    type="url"
                    value={bookingcomIcal}
                    onChange={(e) => setBookingcomIcal(e.target.value)}
                    placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
                    className="w-full p-2.5 bg-white rounded-xl border border-slate-200 text-slate-900 text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95"
                >
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}