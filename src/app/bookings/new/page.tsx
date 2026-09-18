"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Building, User, Calendar, DollarSign } from "lucide-react";
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

  // Financials
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
  const pricePerNight = customPricePerNight ?? (selectedProperty?.base_price_per_night || 0);
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/bookings"
          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Daftar Tempahan Baru</h1>
          <p className="text-xs text-slate-500">Pilih unit, masukkan maklumat tetamu, dan auto-kira harga sewaan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Homestay Unit */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Pilihan Unit Homestay</span>
          </h2>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Unit</label>
            <select
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                const selected = properties.find((p) => p.id === e.target.value);
                if (selected) setDepositAmount(selected.deposit_amount || 100);
              }}
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 text-slate-900"
              required
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.base_price_per_night)}/mlm (Kapasiti: {p.max_guests} pax)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Guest Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Maklumat Tetamu</span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGuestMode("new")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  guestMode === "new" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Tetamu Baru
              </button>
              <button
                type="button"
                onClick={() => setGuestMode("existing")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  guestMode === "existing" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                Pilih Sedia Ada ({guests.length})
              </button>
            </div>
          </div>

          {guestMode === "new" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Penuh *</label>
                <input
                  type="text"
                  placeholder="Contoh: Encik Razak"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  required={guestMode === "new"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">No. WhatsApp *</label>
                <input
                  type="text"
                  placeholder="0123456789"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                  required={guestMode === "new"}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Emel (Pilihan)</label>
                <input
                  type="email"
                  placeholder="razak@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Tetamu Berdaftar</label>
              <select
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
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
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Tarikh & Tempoh Sewaan</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarikh Check-in *</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tarikh Check-out *</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>
          {nights > 0 && (
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 text-xs font-black flex items-center justify-between">
              <span>Tempoh Penginapan:</span>
              <span className="text-sm font-black">{nights} Malam</span>
            </div>
          )}
        </div>

        {/* Section 4: Pricing & Payment */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>Kiraan Harga & Status Bayaran</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Punca Tempahan</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as BookingSource)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              >
                <option value="direct_whatsapp">Direct WhatsApp</option>
                <option value="airbnb">Airbnb</option>
                <option value="booking_com">Booking.com</option>
                <option value="agoda">Agoda</option>
                <option value="other">Lain-lain</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Tempahan</label>
              <select
                value={bookingStatus}
                onChange={(e) => setBookingStatus(e.target.value as BookingStatus)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              >
                <option value="confirmed">Confirmed (Disahkan)</option>
                <option value="pending">Pending (Menunggu)</option>
                <option value="checked_in">Checked In</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Bayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              >
                <option value="deposit_paid">Deposit Paid</option>
                <option value="fully_paid">Fully Paid (Lunas)</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kadar Deposit (RM)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nota Khas</label>
              <input
                type="text"
                placeholder="Contoh: Minta extra pillow"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Pricing Box (Black & Blue Theme) */}
          <div className="p-4 rounded-xl bg-[#0A0D14] text-white space-y-2 text-xs mt-3">
            <div className="flex justify-between text-slate-400 font-semibold">
              <span>Sewa ({nights} mlm × {formatCurrency(pricePerNight)}):</span>
              <span className="text-slate-200">{formatCurrency(nights * pricePerNight)}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-semibold">
              <span>Caj Pembersihan:</span>
              <span className="text-slate-200">{formatCurrency(cleaningFee)}</span>
            </div>
            <div className="h-[1px] bg-slate-800 my-1.5" />
            <div className="flex justify-between font-black text-sm text-sky-400">
              <span>Jumlah Keseluruhan:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/bookings"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Menyimpan..." : "Simpan Tempahan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}