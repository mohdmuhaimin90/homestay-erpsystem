"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Building, 
  User, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Tag, 
  CheckCircle2,
  Info
} from "lucide-react";
import { getProperties, getGuests, saveBooking, saveGuest } from "@/lib/supabase";
import { Property, Guest, BookingSource, PaymentStatus, BookingStatus } from "@/lib/types";
import { calculateNights, formatCurrency } from "@/lib/utils";

export default function NewBookingPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  
  // Form States
  const [propertyId, setPropertyId] = useState("");
  const [guestMode, setGuestMode] = useState<"new" | "existing">("new");
  const [guestId, setGuestId] = useState("");
  
  // New Guest Fields
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Booking Dates
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // Financials & Channel Pricing
  const [source, setSource] = useState<BookingSource>("direct_whatsapp");
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("confirmed");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("deposit_paid");
  const [depositAmount, setDepositAmount] = useState(100);
  const [customPricePerNight, setCustomPricePerNight] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [p, g] = await Promise.all([getProperties(), getGuests()]);
      setProperties(p);
      setGuests(g);
      if (p.length > 0) {
        setPropertyId(p[0].id);
        setDepositAmount(p[0].deposit_amount || 100);
      }
    }
    load();
  }, []);

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const nights = calculateNights(checkIn, checkOut);

  // Auto channel pricing calculation
  const getChannelRate = (src: BookingSource, prop?: Property) => {
    if (!prop) return 0;
    if (src === "direct_whatsapp") return prop.price_direct || prop.base_price_per_night || 250;
    if (src === "airbnb") return prop.price_airbnb || Math.round((prop.base_price_per_night || 250) * 1.15);
    if (src === "booking_com") return prop.price_bookingcom || Math.round((prop.base_price_per_night || 250) * 1.18);
    return prop.base_price_per_night || 250;
  };

  const autoChannelRate = getChannelRate(source, selectedProperty);
  const pricePerNight = customPricePerNight !== null ? customPricePerNight : autoChannelRate;
  const cleaningFee = selectedProperty?.cleaning_fee || 0;
  const totalPrice = (nights * pricePerNight) + cleaningFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || nights <= 0) {
      alert("Sila pilih tarikh Check-in dan Check-out yang sah!");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalGuestId = guestId;

      if (guestMode === "new") {
        if (!guestName || !guestPhone) {
          alert("Sila masukkan nama dan nombor telefon tetamu!");
          setIsSubmitting(false);
          return;
        }
        const createdGuest = await saveGuest({
          name: guestName,
          phone: guestPhone,
          email: guestEmail,
        });
        finalGuestId = createdGuest.id;
      }

      await saveBooking({
        property_id: propertyId,
        guest_id: finalGuestId,
        check_in: checkIn,
        check_out: checkOut,
        total_nights: nights,
        total_price: totalPrice,
        deposit_amount: depositAmount,
        source: source,
        booking_status: bookingStatus,
        payment_status: paymentStatus,
        notes: notes,
        property: selectedProperty,
        guest: guestMode === "new" ? { id: finalGuestId, name: guestName, phone: guestPhone } : guests.find(g => g.id === finalGuestId),
      });

      router.push("/bookings");
    } catch (err) {
      console.error(err);
      alert("Ralat semasa menyimpan tempahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/bookings"
          className="w-10 h-10 rounded-xl bg-[#0D121D] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-[10px] font-black tracking-wider text-indigo-400 uppercase">
            RESERVATION CREATION · MULTI-CHANNEL
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Daftar Tempahan Baru</h1>
          <p className="text-xs text-slate-400">Harga auto-laras mengikut saluran (Direct WhatsApp vs Airbnb vs Booking.com).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Homestay Unit & Channel */}
        <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>1. Pilihan Unit Homestay & Saluran</span>
            </h2>
            <span className="text-[11px] text-slate-400">Langkah 1 daripada 4</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Pilih Unit Homestay *</label>
              <select
                value={propertyId}
                onChange={(e) => {
                  setPropertyId(e.target.value);
                  const selected = properties.find((p) => p.id === e.target.value);
                  if (selected) setDepositAmount(selected.deposit_amount || 100);
                }}
                className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                required
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Direct: {formatCurrency(p.price_direct || p.base_price_per_night)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Punca Tempahan / Saluran Jualan *</label>
              <select
                value={source}
                onChange={(e) => {
                  const newSource = e.target.value as BookingSource;
                  setSource(newSource);
                  setCustomPricePerNight(null); // Reset custom override to use new channel's default
                }}
                className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="direct_whatsapp">🟢 Direct WhatsApp (Harga Bersih Tanpa Komisen)</option>
                <option value="airbnb">🔴 Airbnb (Termasuk Markup Caj Airbnb)</option>
                <option value="booking_com">🔵 Booking.com (Termasuk Markup Caj OTA)</option>
                <option value="agoda">Agoda</option>
                <option value="other">Lain-lain / Walk-in</option>
              </select>
            </div>
          </div>

          {/* Quick Rate Banner */}
          {selectedProperty && (
            <div className="p-3 bg-[#080B11] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Kadar Auto Saluran Ini:</span>
              <span className="font-mono font-black text-indigo-400">
                {formatCurrency(autoChannelRate)} / malam
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Guest Details */}
        <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>2. Maklumat Tetamu</span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGuestMode("new")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  guestMode === "new" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
                    : "bg-[#111726] text-slate-400 hover:text-white"
                }`}
              >
                Tetamu Baru
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("existing")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  guestMode === "existing" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" 
                    : "bg-[#111726] text-slate-400 hover:text-white"
                }`}
              >
                Pilih Sedia Ada ({guests.length})
              </button>
            </div>
          </div>

          {guestMode === "new" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nama Penuh *</label>
                <input
                  type="text"
                  placeholder="Contoh: Encik Razak"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                  required={guestMode === "new"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">No. WhatsApp *</label>
                <input
                  type="text"
                  placeholder="0123456789"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                  required={guestMode === "new"}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Emel (Pilihan)</label>
                <input
                  type="email"
                  placeholder="razak@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Pilih Tetamu Berdaftar</label>
              <select
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                required={guestMode === "existing"}
              >
                <option value="">-- Sila Pilih Tetamu --</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.phone})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Section 3: Dates & Nights */}
        <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
          <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>3. Tarikh & Tempoh Sewaan</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Tarikh Check-in *</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Tarikh Check-out *</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white focus:border-indigo-500 focus:outline-hidden"
                required
              />
            </div>
          </div>
          {nights > 0 && (
            <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-800/60 text-indigo-300 text-xs font-black flex items-center justify-between">
              <span>Tempoh Penginapan:</span>
              <span className="text-sm font-black text-indigo-200">{nights} Malam</span>
            </div>
          )}
        </div>

        {/* Section 4: Pricing & Payment */}
        <div className="p-6 rounded-2xl bg-[#0D121D] border border-slate-800 shadow-xl space-y-4">
          <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>4. Kiraan Harga & Status Bayaran</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Status Tempahan</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white"
              >
                <option value="confirmed">Confirmed (Disahkan)</option>
                <option value="pending">Pending (Menunggu)</option>
                <option value="checked_in">Checked In</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Status Bayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white"
              >
                <option value="deposit_paid">Deposit Paid</option>
                <option value="fully_paid">Fully Paid (Lunas)</option>
                <option value="unpaid">Unpaid (Belum Bayar)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kadar Semalam (RM)
                <span className="text-slate-500 font-normal ml-1">
                  (Auto: RM {autoChannelRate})
                </span>
              </label>
              <input
                type="number"
                value={pricePerNight}
                onChange={(e) => setCustomPricePerNight(Number(e.target.value))}
                className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white"
                placeholder={String(autoChannelRate)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Jumlah Deposit (RM)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-[#111726] rounded-xl border border-slate-800 text-xs font-bold text-white"
              />
            </div>
          </div>

          {/* Transparent Calculation Breakdown */}
          <div className="p-4 bg-[#080B11] rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Sewa ({nights} malam x {formatCurrency(pricePerNight)}):</span>
              <span className="text-slate-200 font-semibold">{formatCurrency(nights * pricePerNight)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Caj Kebersihan / Cleaning:</span>
              <span className="text-slate-200 font-semibold">{formatCurrency(cleaningFee)}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
              <span className="font-extrabold text-white text-sm">Jumlah Keseluruhan:</span>
              <span className="text-xl font-black text-emerald-400">{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Catatan Tambahan (Pilihan)</label>
            <textarea
              rows={3}
              placeholder="Contoh: Booking melalui WhatsApp direct, perlukan tilam tambahan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-[#111726] rounded-xl border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/bookings"
            className="px-6 py-3 bg-[#111726] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-800"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Tempahan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}