"use client";

import { useEffect, useState } from "react";
import { MessageSquareShare, Send, Copy, Check, Sparkles, Building, Key, ShieldCheck, Clock } from "lucide-react";
import { getBookings } from "@/lib/supabase";
import { Booking } from "@/lib/types";
import { formatCurrency, formatDate, generateWhatsAppUrl } from "@/lib/utils";

export default function WhatsAppPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [templateType, setTemplateType] = useState<"confirmation" | "checkin" | "payment_reminder" | "checkout">("checkin");
  const [customPhone, setCustomPhone] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const b = await getBookings();
      setBookings(b);
      if (b.length > 0) {
        setSelectedBookingId(b[0].id);
      }
    }
    load();
  }, []);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  useEffect(() => {
    if (!selectedBooking) return;

    const guestName = selectedBooking.guest?.name || "Pelanggan";
    const propertyName = selectedBooking.property?.name || "Homestay";
    const checkIn = formatDate(selectedBooking.check_in);
    const checkOut = formatDate(selectedBooking.check_out);
    const total = formatCurrency(selectedBooking.total_price);
    const deposit = formatCurrency(selectedBooking.deposit_amount);
    const balance = formatCurrency((selectedBooking.total_price || 0) - (selectedBooking.deposit_amount || 0));
    const passcode = selectedBooking.property?.smartlock_code || "1234#";
    const wifiSsid = selectedBooking.property?.wifi_ssid || "Homestay_WiFi";
    const wifiPass = selectedBooking.property?.wifi_password || "12345678";
    const address = selectedBooking.property?.address || "Alamat Homestay";

    setCustomPhone(selectedBooking.guest?.phone || "");

    let msg = "";
    if (templateType === "confirmation") {
      msg = `Salam ${guestName},\n\nTerima kasih kerana memilih *${propertyName}*! 🏡✨\n\n📌 *BUTIRAN TEMPAHAN:*\n• Check-in: ${checkIn} (3:00 PM)\n• Check-out: ${checkOut} (12:00 PM)\n• Tempoh: ${selectedBooking.total_nights} Malam\n• Jumlah Sewa: ${total}\n• Deposit Dibayar: ${deposit}\n• Baki Perlu Dibayar: ${balance}\n\nTempahan anda telah *DISAHKAN*. Kami akan hantar maklumat check-in dan passcode pintu sebelum ketibaan anda.\n\nSebarang pertanyaan boleh terus balas mesej ini. Terima kasih!`;
    } else if (templateType === "checkin") {
      msg = `Salam ${guestName}! 🌟\n\nSelamat datang ke *${propertyName}*.\nBerikut adalah panduan *Self Check-In* untuk penginapan anda:\n\n📍 *LOKASI HOMESTAY:*\n${address}\n\n🔐 *PINTU UTAMA (SMARTLOCK):*\n• Passcode: *${passcode}* (Tekan kod & diakhiri #)\n\n📶 *WIFI:*\n• SSID: *${wifiSsid}*\n• Kata Laluan: *${wifiPass}*\n\n⏰ *WAKTU:*\n• Check-In: 3:00 PM\n• Check-Out: 12:00 PM\n\nSila pastikan pintu sentiasa dikunci apabila keluar. Selamat berehat dan semoga menikmati percutian anda! 🏡✨`;
    } else if (templateType === "payment_reminder") {
      msg = `Salam ${guestName},\n\nPeringatan mesra mengenai baki bayaran sewaan untuk *${propertyName}*:\n\n• Tarikh Masuk: ${checkIn}\n• Baki Bayaran: *${balance}*\n\nSila buat bayaran ke akaun kami dan kemukakan slip resit di sini. Terima kasih atas kerjasama anda! 🙏`;
    } else if (templateType === "checkout") {
      msg = `Salam ${guestName},\n\nTerima kasih kerana menginap di *${propertyName}*! Kami harap anda sekeluarga gembira sepanjang berada di sini. 🏡\n\n⏰ *Peringatan Check-out: 12:00 PM*\n• Sila pastikan suis lampu & aircond ditutup.\n• Rapatkan dan kunci pintu rapat.\n• Deposit keselamatan anda akan dipulangkan selepas sesi housekeeping selesai.\n\nSemoga jumpa lagi di masa akan datang! ⭐⭐⭐⭐⭐`;
    }

    setCustomMessage(msg);
  }, [selectedBookingId, templateType, selectedBooking]);

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareShare className="w-5 h-5 text-blue-600" />
          <span>Penjana Mesej Rasmi & Resit WhatsApp</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Jana draf mesej arahan masuk, passcode smartlock, dan resit bayaran dalam 1-klik terus ke WhatsApp tetamu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template & Booking Selector */}
        <div className="space-y-5 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2">1. Pilih Tempahan Tetamu</h2>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
            >
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.guest?.name} — {b.property?.name} ({formatDate(b.check_in)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2">2. Pilih Jenis Templat</h2>
            <div className="space-y-2">
              {[
                { id: "checkin", icon: Key, label: "Arahan Check-In & Smartlock", desc: "Passcode pintu, WiFi, alamat & waktu masuk" },
                { id: "confirmation", icon: ShieldCheck, label: "Pengesahan Tempahan", desc: "Butiran tarikh, sewa & resit deposit" },
                { id: "payment_reminder", icon: Building, label: "Peringatan Baki Bayaran", desc: "Peringatan baki sewaan yang belum lunas" },
                { id: "checkout", icon: Clock, label: "Terima Kasih & Check-Out", desc: "Peringatan waktu keluar & pemulangan deposit" },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = templateType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateType(t.id as any)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-xs font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`font-black text-xs ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                        {t.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Pratonton Teks WhatsApp</span>
              </h2>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Disalin!" : "Salin Mesej"}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. Telefon WhatsApp Tetamu</label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="0123456789"
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kandungan Mesej</label>
              <textarea
                rows={12}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <a
              href={generateWhatsAppUrl(customPhone, customMessage)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              <span>Buka di WhatsApp Web / App</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}