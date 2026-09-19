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
  Bath,
  ExternalLink,
  X,
  Info
} from "lucide-react";
import { getProperties, saveProperty } from "@/lib/supabase";
import { Property } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function PropertiesPage() {
  const { t, language } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedPropId, setCopiedPropId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [rentalType, setRentalType] = useState<"daily" | "monthly">("daily");
  const [monthlyRentalRate, setMonthlyRentalRate] = useState(700);
  const [basePrice, setBasePrice] = useState(220);
  const [priceDirect, setPriceDirect] = useState(220);
  const [priceAirbnb, setPriceAirbnb] = useState(260);
  const [priceBookingcom, setPriceBookingcom] = useState(270);
  const [cleaningFee, setCleaningFee] = useState(40);
  const [deposit, setDeposit] = useState(100);
  const [rooms, setRooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(1);
  const [toilets, setToilets] = useState(1);
  const [maxGuests, setMaxGuests] = useState(8);
  const [smartlock, setSmartlock] = useState("1234#");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [airbnbIcal, setAirbnbIcal] = useState("");
  const [bookingcomIcal, setBookingcomIcal] = useState("");
  const [notes, setNotes] = useState("");

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
        setSyncResult(
          language === "bm"
            ? `✅ Selesai! Sebanyak ${data.importedCount} tempahan baru berjaya diselaraskan dari Airbnb/Booking.com.`
            : `✅ Success! Synced ${data.importedCount} new reservations from Airbnb/Booking.com.`
        );
        loadData();
      } else {
        setSyncResult(language === "bm" ? `Ralat: ${data.error || "Gagal menyelaraskan iCal."}` : `Error: ${data.error || "Failed to sync iCal."}`);
      }
    } catch (err: any) {
      setSyncResult(language === "bm" ? `Ralat penyelarasan: ${err.message}` : `Sync error: ${err.message}`);
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
      rental_type: rentalType,
      monthly_rental_rate: rentalType === "monthly" ? Number(monthlyRentalRate) : undefined,
      base_price_per_night: rentalType === "monthly" ? 0 : Number(basePrice),
      price_direct: rentalType === "monthly" ? 0 : Number(priceDirect || basePrice),
      price_airbnb: rentalType === "monthly" ? 0 : Number(priceAirbnb || basePrice),
      price_bookingcom: rentalType === "monthly" ? 0 : Number(priceBookingcom || basePrice),
      cleaning_fee: Number(cleaningFee),
      deposit_amount: Number(deposit),
      total_rooms: Number(rooms),
      total_bathrooms: Number(bathrooms),
      total_toilets: Number(toilets),
      max_guests: Number(maxGuests),
      smartlock_code: smartlock,
      wifi_ssid: wifiSsid,
      wifi_password: wifiPass,
      google_maps_url: mapsUrl,
      airbnb_ical_url: airbnbIcal,
      bookingcom_ical_url: bookingcomIcal,
      notes,
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
    <div className="space-y-6 pb-16">
      {/* Top Banner (StayVault Luxury Dark Theme) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-indigo-800/60 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>{language === "bm" ? "HOMESTAY KENANGAN · SENARAI PREMIS & KADAR" : "HOMESTAY KENANGAN · PROPERTIES & RATES"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            {language === "bm" ? (
              <>Unit Homestay & <span className="text-indigo-400">Penyewaan Bilik</span></>
            ) : (
              <>Homestay Units & <span className="text-indigo-400">Room Rentals</span></>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            {language === "bm" 
              ? "Pengurusan 3 unit rasmi Homestay Kenangan di Kemaman & Gong Badak, termasuk Room Rental bulanan dan kadar pelbagai saluran."
              : "Management of 3 official Homestay Kenangan units in Kemaman & Gong Badak, including monthly room rentals and multi-channel rates."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111726] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shadow-md transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
            <span>{syncing ? (language === "bm" ? "Sedang Sync..." : "Syncing...") : t("properties.btn_sync_ical")}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("properties.btn_add_unit")}</span>
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
          const lowerName = (p.name || "").toLowerCase();
          const isMonthlyRental = p.rental_type === "monthly" || p.id === "kemaman-1" || lowerName.includes("kemaman 1");
          const directRate = p.price_direct || p.base_price_per_night;
          const airbnbRate = p.price_airbnb || Math.round(p.base_price_per_night * 1.18);
          const bookingRate = p.price_bookingcom || Math.round(p.base_price_per_night * 1.22);

          return (
            <div 
              key={p.id} 
              className={`rounded-3xl border shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                isMonthlyRental 
                  ? "bg-gradient-to-b from-[#111728] to-[#0D121D] border-amber-500/40" 
                  : "bg-[#0D121D] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="p-6 space-y-4">
                {/* Header: Status & Unit Name */}
                <div>
                  <div className="flex items-center justify-between">
                    {isMonthlyRental ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-full">
                        🏠 {language === "bm" ? "ROOM RENTAL (BULANAN)" : "ROOM RENTAL (MONTHLY)"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-full">
                        🏡 {language === "bm" ? "HOMESTAY HARIAN" : "DAILY HOMESTAY"}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">ID: {p.id}</span>
                  </div>

                  <h3 className="font-black text-white text-lg mt-2.5 tracking-tight">{p.name}</h3>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      <span>{p.address || "Kemaman, Terengganu"}</span>
                    </p>
                    {p.google_maps_url && (
                      <a
                        href={p.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                        title={language === "bm" ? "Buka Google Maps" : "Open Google Maps"}
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Capacity & Rooms Specs */}
                <div className="p-3.5 bg-[#111726] rounded-2xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">{t("properties.unit_size")}</span>
                    <div className="text-white font-black mt-0.5">
                      {p.total_rooms || 3} {language === "bm" ? "Bilik" : "Rooms"}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">{t("properties.bath_toilet")}</span>
                    <div className="text-white font-black mt-0.5">
                      {lowerName.includes("gong badak") 
                        ? (language === "bm" ? "4 Bilik Air" : "4 Bathrooms")
                        : `${p.total_toilets || 1} ${language === "bm" ? "Toilet" : "Toilet"} · ${p.total_bathrooms || 1} ${language === "bm" ? "Bathroom" : "Bathroom"}`}
                    </div>
                  </div>
                </div>

                {/* Pricing: Monthly vs Daily Multi-Channel */}
                {isMonthlyRental ? (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5 text-center">
                    <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">
                      {t("properties.monthly_rental_rate")}
                    </span>
                    <div className="text-2xl font-black text-white">
                      RM {p.monthly_rental_rate || 700} <span className="text-xs text-amber-300 font-normal">/ {language === "bm" ? "bulan" : "month"}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {language === "bm" ? "Penyewaan jangka panjang tetap. Rumah bahagian belakang." : "Fixed long-term room rental. Back house."}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#080B11] border border-slate-800 space-y-2">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <span>{t("properties.rate_by_channel")}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {/* Direct WhatsApp */}
                      <div className="p-2 rounded-xl bg-[#111726] border border-emerald-900/40 text-center">
                        <span className="text-[9px] font-black text-emerald-400 uppercase block">Direct WA</span>
                        <div className="text-sm font-black text-white mt-0.5">{formatCurrency(directRate)}</div>
                        <span className="text-[9px] text-slate-400">{t("properties.net_price")}</span>
                      </div>

                      {/* Airbnb */}
                      <div className="p-2 rounded-xl bg-[#111726] border border-rose-900/40 text-center">
                        <span className="text-[9px] font-black text-rose-400 uppercase block">Airbnb</span>
                        <div className="text-sm font-black text-white mt-0.5">{formatCurrency(airbnbRate)}</div>
                        <span className="text-[9px] text-slate-400">+18% {t("properties.platform_fee")}</span>
                      </div>

                      {/* Booking.com */}
                      <div className="p-2 rounded-xl bg-[#111726] border border-cyan-900/40 text-center">
                        <span className="text-[9px] font-black text-cyan-400 uppercase block">Booking</span>
                        <div className="text-sm font-black text-white mt-0.5">{formatCurrency(bookingRate)}</div>
                        <span className="text-[9px] text-slate-400">+20% {t("properties.platform_fee")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smartlock & Wifi */}
                <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold"><Key className="w-3.5 h-3.5 text-amber-400" /> Smartlock:</span>
                    <span className="font-mono font-black text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-800/60">
                      {p.smartlock_code || "8899#"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold"><Wifi className="w-3.5 h-3.5 text-cyan-400" /> WiFi:</span>
                    <span className="font-semibold text-slate-200">{p.wifi_ssid || "HomestayKenangan"}</span>
                  </div>
                </div>

                {/* iCal Link (For daily homestay) */}
                {!isMonthlyRental && (
                  <div className="p-3 bg-[#080B11] border border-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1 text-cyan-400 text-[11px]">
                        <CalendarSync className="w-3 h-3" /> {t("properties.ical_export_title")}
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
                        <span>{copiedPropId === p.id ? (language === "bm" ? "Disalin" : "Copied") : (language === "bm" ? "Salin" : "Copy")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-[#080B11]/90 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 font-mono">
                  {isMonthlyRental ? (language === "bm" ? "Rumah Belakang" : "Back House") : p.id === "kemaman-2" ? (language === "bm" ? "Rumah Depan" : "Front House") : (language === "bm" ? "Banglo 4 Bilik" : "4-Bedroom Bungalow")}
                </span>
                <span className="text-[11px] text-indigo-400 font-black">Homestay Kenangan ⚡</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Unit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D121D] border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">
                  {language === "bm" ? "Tambah Unit Homestay / Rental" : "Add Homestay / Rental Unit"}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === "bm" ? "Tetapkan jenis sewaan (Harian atau Sewa Bulanan)." : "Set rental operation type (Daily or Monthly Rental)."}
                </p>
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
                <label className="block font-bold text-slate-300 mb-1">{language === "bm" ? "Nama Unit *" : "Unit Name *"}</label>
                <input
                  type="text"
                  placeholder={language === "bm" ? "Contoh: Homestay Kenangan Kemaman 2" : "E.g., Homestay Kenangan Kemaman 2"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold focus:border-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Rental Type Selector */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">{language === "bm" ? "Jenis Operasi Sewaan *" : "Rental Operation Type *"}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRentalType("daily")}
                    className={`p-3 rounded-xl border text-left transition ${
                      rentalType === "daily" 
                        ? "bg-indigo-600 text-white border-indigo-500 font-black" 
                        : "bg-[#111726] text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{language === "bm" ? "🏡 Homestay Harian" : "🏡 Daily Homestay"}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{language === "bm" ? "Sewa harian ikut malam & platform" : "Daily rental by night & platform"}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRentalType("monthly")}
                    className={`p-3 rounded-xl border text-left transition ${
                      rentalType === "monthly" 
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black" 
                        : "bg-[#111726] text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{language === "bm" ? "🏠 Room Rental Bulanan" : "🏠 Monthly Room Rental"}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{language === "bm" ? "Cth: Kemaman 1 (RM700/bulan)" : "E.g., Kemaman 1 (RM700/month)"}</div>
                  </button>
                </div>
              </div>

              {rentalType === "monthly" ? (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
                  <label className="block font-bold text-amber-300">{language === "bm" ? "Kadar Sewaan Bulanan (RM) *" : "Monthly Rental Rate (RM) *"}</label>
                  <input
                    type="number"
                    value={monthlyRentalRate}
                    onChange={(e) => setMonthlyRentalRate(Number(e.target.value))}
                    className="w-full p-3 bg-[#111726] rounded-xl border border-amber-500/50 text-white font-black text-sm"
                    placeholder="700"
                    required
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#080B11] border border-slate-800 space-y-3">
                  <span className="font-black text-indigo-400 uppercase text-[10px] tracking-wider block">
                    {language === "bm" ? "💰 Kadar Mengikut Saluran Jualan" : "💰 Multi-Channel Rates"}
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
                        placeholder="220"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-rose-400 mb-1">Airbnb (RM) *</label>
                      <input
                        type="number"
                        value={priceAirbnb}
                        onChange={(e) => setPriceAirbnb(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#111726] rounded-xl border border-rose-800/80 text-white font-bold"
                        placeholder="260"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-cyan-400 mb-1">Booking.com (RM) *</label>
                      <input
                        type="number"
                        value={priceBookingcom}
                        onChange={(e) => setPriceBookingcom(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#111726] rounded-xl border border-cyan-800/80 text-white font-bold"
                        placeholder="270"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bilik, Toilet, Bathroom */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{language === "bm" ? "Jumlah Bilik" : "Bedrooms"}</label>
                  <input
                    type="number"
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{language === "bm" ? "Toilet" : "Toilets"}</label>
                  <input
                    type="number"
                    value={toilets}
                    onChange={(e) => setToilets(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">{language === "bm" ? "Bathroom" : "Bathrooms"}</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">{language === "bm" ? "Pautan Google Maps" : "Google Maps Link"}</label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold"
                >
                  {t("action.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg transition"
                >
                  {t("properties.save_unit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}