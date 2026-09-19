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
  DollarSign,
  Tag,
  Layers,
  CheckCircle2,
  X
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
  const [priceDirect, setPriceDirect] = useState(240);
  const [priceAirbnb, setPriceAirbnb] = useState(285);
  const [priceBookingcom, setPriceBookingcom] = useState(295);
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
      price_direct: Number(priceDirect || basePrice),
      price_airbnb: Number(priceAirbnb || basePrice),
      price_bookingcom: Number(priceBookingcom || basePrice),
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
    <div className="space-y-6 pb-12">
      {/* Top Banner (StayVault Luxury Dark Theme) */}
      <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-indigo-800/60 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>PENGURUSAN PREMIS & KADAR SALURAN JUALAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Unit Homestay & <span className="text-indigo-400">Penyelarasan Saluran</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kawal kadar sewaan mengikut saluran (Direct WhatsApp vs Airbnb vs Booking.com), kod smartlock, dan iCal feed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111726] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shadow-md transition-all hover:-translate-y-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
            <span>{syncing ? "Sedang Sync..." : "Sync Airbnb & Booking"}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Unit Baru</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          syncResult.startsWith("✅") 
            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" 
            : "bg-rose-950/80 text-rose-300 border border-rose-800"
        }`}>
          {syncResult}
        </div>
      )}

      {/* Properties Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => {
          const directRate = p.price_direct || p.base_price_per_night;
          const airbnbRate = p.price_airbnb || Math.round(p.base_price_per_night * 1.15);
          const bookingRate = p.price_bookingcom || Math.round(p.base_price_per_night * 1.18);

          return (
            <div 
              key={p.id} 
              className="rounded-2xl bg-[#0D121D] border border-slate-800/90 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {/* Header: Status & Unit Name */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full">
                      {p.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {p.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="font-black text-white text-lg mt-2 tracking-tight">{p.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span>{p.address || "Lokasi belum ditetapkan"}</span>
                  </p>
                </div>

                {/* Capacity & Cleaning */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#111726] rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Kapasiti</span>
                    <div className="text-white font-black mt-0.5">{p.total_rooms} Bilik ({p.max_guests} Pax)</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Caj Cuci & Deposit</span>
                    <div className="text-white font-black mt-0.5">RM {p.cleaning_fee || 0} / RM {p.deposit_amount || 100}</div>
                  </div>
                </div>

                {/* Multi-Channel Pricing Breakdown Card */}
                <div className="p-4 rounded-xl bg-[#0A0E17] border border-slate-800 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    <span>Kadar Harga Mengikut Saluran</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* Direct WhatsApp */}
                    <div className="p-2 rounded-lg bg-[#121927] border border-emerald-900/40 text-center">
                      <span className="text-[9px] font-black text-emerald-400 uppercase block">Direct WA</span>
                      <div className="text-sm font-black text-white mt-0.5">{formatCurrency(directRate)}</div>
                      <span className="text-[9px] text-slate-400">Harga Bersih</span>
                    </div>

                    {/* Airbnb */}
                    <div className="p-2 rounded-lg bg-[#121927] border border-rose-900/40 text-center">
                      <span className="text-[9px] font-black text-rose-400 uppercase block">Airbnb</span>
                      <div className="text-sm font-black text-white mt-0.5">{formatCurrency(airbnbRate)}</div>
                      <span className="text-[9px] text-slate-400">+15% Komisen</span>
                    </div>

                    {/* Booking.com */}
                    <div className="p-2 rounded-lg bg-[#121927] border border-cyan-900/40 text-center">
                      <span className="text-[9px] font-black text-cyan-400 uppercase block">Booking.com</span>
                      <div className="text-sm font-black text-white mt-0.5">{formatCurrency(bookingRate)}</div>
                      <span className="text-[9px] text-slate-400">+18% Komisen</span>
                    </div>
                  </div>
                </div>

                {/* Smartlock & Wifi Info */}
                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold"><Key className="w-3.5 h-3.5 text-amber-400" /> Smartlock Pintu:</span>
                    <span className="font-mono font-black text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-800/60">
                      {p.smartlock_code || "1234#"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold"><Wifi className="w-3.5 h-3.5 text-cyan-400" /> WiFi SSID:</span>
                    <span className="font-semibold text-slate-200">{p.wifi_ssid || "-"}</span>
                  </div>
                </div>

                {/* iCal Export Feed */}
                <div className="p-3.5 bg-[#080B11] border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-cyan-400 text-xs">
                      <CalendarSync className="w-3.5 h-3.5" /> iCal Export Feed (Airbnb / Booking)
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#111726] p-2 rounded-lg text-[11px] font-mono border border-slate-800">
                    <span className="truncate max-w-[170px] text-slate-400">/api/ical/{p.id}</span>
                    <button
                      type="button"
                      onClick={() => copyIcalExportUrl(p.id)}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px] ml-2 shrink-0"
                    >
                      {copiedPropId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPropId === p.id ? "Disalin!" : "Salin Link"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-[#0A0E17] border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400">2-Way Sync Active</span>
                <span className="text-[11px] text-indigo-400 font-black">Homestay Siap Sedia ⚡</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Unit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D121D] border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">Tambah Unit Homestay Baru</h3>
                <p className="text-xs text-slate-400">Tetapkan harga ikut saluran untuk elak rugi caj komisen.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Unit Homestay *</label>
                <input
                  type="text"
                  placeholder="Contoh: Villa Anggun 3 Bilik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Alamat Penuh</label>
                <input
                  type="text"
                  placeholder="No 123, Jalan Kenanga..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* 3-Channel Pricing Settings */}
              <div className="p-4 rounded-xl bg-[#080B11] border border-slate-800 space-y-3">
                <span className="font-black text-indigo-400 uppercase text-[10px] tracking-wider block">
                  💰 Tetapan Harga Mengikut Saluran Jualan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-emerald-400 mb-1">Direct WA (RM) *</label>
                    <input
                      type="number"
                      value={priceDirect}
                      onChange={(e) => {
                        setPriceDirect(Number(e.target.value));
                        setBasePrice(Number(e.target.value));
                      }}
                      className="w-full p-2.5 bg-[#111726] rounded-xl border border-emerald-800/80 text-white font-bold"
                      placeholder="250"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Tiada caj komisen</span>
                  </div>

                  <div>
                    <label className="block font-bold text-rose-400 mb-1">Airbnb (RM) *</label>
                    <input
                      type="number"
                      value={priceAirbnb}
                      onChange={(e) => setPriceAirbnb(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#111726] rounded-xl border border-rose-800/80 text-white font-bold"
                      placeholder="290"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Cover caj Airbnb</span>
                  </div>

                  <div>
                    <label className="block font-bold text-cyan-400 mb-1">Booking.com (RM) *</label>
                    <input
                      type="number"
                      value={priceBookingcom}
                      onChange={(e) => setPriceBookingcom(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#111726] rounded-xl border border-cyan-800/80 text-white font-bold"
                      placeholder="300"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Cover caj OTA</span>
                  </div>
                </div>
              </div>

              {/* Cleaning fee & Deposit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Caj Cuci / Cleaning (RM)</label>
                  <input
                    type="number"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jumlah Deposit (RM)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              {/* Rooms & Smartlock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Bilik</label>
                  <input
                    type="number"
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                    className="w-full p-2 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Pax Max</label>
                  <input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(Number(e.target.value))}
                    className="w-full p-2 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 mb-1">Kod Smartlock</label>
                  <input
                    type="text"
                    value={smartlock}
                    onChange={(e) => setSmartlock(e.target.value)}
                    className="w-full p-2 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold font-mono"
                  />
                </div>
              </div>

              {/* Inbound iCal Feed */}
              <div className="p-4 bg-[#080B11] rounded-xl space-y-3 border border-slate-800">
                <span className="font-bold text-slate-300 block text-xs">Penyelarasan Kalendar Masuk (iCal Import)</span>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Airbnb iCal Export URL</label>
                  <input
                    type="url"
                    value={airbnbIcal}
                    onChange={(e) => setAirbnbIcal(e.target.value)}
                    placeholder="https://www.airbnb.com/calendar/ical/..."
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-slate-300 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Booking.com iCal Export URL</label>
                  <input
                    type="url"
                    value={bookingcomIcal}
                    onChange={(e) => setBookingcomIcal(e.target.value)}
                    placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-slate-300 text-[11px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 transition"
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