"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "bm" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

export const translations: Record<string, { bm: string; en: string }> = {
  // Navigation
  "nav.dashboard": { bm: "Dashboard", en: "Dashboard" },
  "nav.reservations": { bm: "Tempahan", en: "Reservations" },
  "nav.calendar": { bm: "Kalendar Bilik", en: "Calendar Matrix" },
  "nav.properties": { bm: "Bilik & Unit", en: "Rooms & Units" },
  "nav.guests": { bm: "Tetamu", en: "Guests" },
  "nav.whatsapp": { bm: "WhatsApp & Invois", en: "WhatsApp & Invoicing" },
  "nav.import": { bm: "Import Data", en: "Data Import & Sync" },
  "nav.settings": { bm: "Tetapan", en: "Settings" },
  "nav.operations": { bm: "OPERASI", en: "OPERATIONS" },
  "nav.intelligence": { bm: "PENGURUSAN", en: "INTELLIGENCE" },
  "nav.live_online": { bm: "Atas Talian", en: "Live Online" },

  // Header
  "header.control_hub": { bm: "Pusat Kawalan Homestay", en: "Homestay Control Hub" },
  "header.overview": { bm: "Ringkasan Operasi", en: "Overview" },
  "header.new_reservation": { bm: "Tempahan Baru", en: "New Reservation" },
  "header.family_admin": { bm: "Admin Keluarga", en: "Family Admin" },
  "header.logout": { bm: "Log Keluar", en: "Log Out" },

  // Common Actions
  "action.save": { bm: "Simpan", en: "Save" },
  "action.cancel": { bm: "Batal", en: "Cancel" },
  "action.close": { bm: "Tutup", en: "Close" },
  "action.search": { bm: "Cari...", en: "Search..." },
  "action.filter": { bm: "Tapis", en: "Filter" },
  "action.edit": { bm: "Kemaskini", en: "Edit" },
  "action.delete": { bm: "Padam", en: "Delete" },
  "action.copy": { bm: "Salin", en: "Copy" },
  "action.copied": { bm: "Disalin!", en: "Copied!" },
  "action.send_whatsapp": { bm: "Hantar WhatsApp", en: "Send WhatsApp" },
  "action.mark_checked_in": { bm: "Tanda Sudah Masuk", en: "Mark Checked In" },
  "action.mark_checked_out": { bm: "Tanda Sudah Keluar", en: "Mark Checked Out" },
  "action.view_details": { bm: "Lihat Butiran", en: "View Details" },

  // Statuses & Badges
  "status.confirmed": { bm: "Disahkan", en: "Confirmed" },
  "status.pending": { bm: "Menunggu", en: "Pending" },
  "status.checked_in": { bm: "Sedang Menginap", en: "Checked In" },
  "status.checked_out": { bm: "Selesai Menginap", en: "Checked Out" },
  "status.cancelled": { bm: "Dibatalkan", en: "Cancelled" },
  "status.unpaid": { bm: "Belum Bayar", en: "Unpaid" },
  "status.deposit_paid": { bm: "Deposit Dibayar", en: "Deposit Paid" },
  "status.fully_paid": { bm: "Bayaran Penuh", en: "Fully Paid" },
  "status.refunded": { bm: "Deposit Dipulangkan", en: "Deposit Refunded" },
  "badge.monthly_rental": { bm: "ROOM RENTAL (BULANAN)", en: "ROOM RENTAL (MONTHLY)" },
  "badge.daily_homestay": { bm: "HOMESTAY HARIAN", en: "DAILY HOMESTAY" },
  "badge.room_available": { bm: "KOSONG - BOLEH SEWA", en: "AVAILABLE - READY" },
  "badge.room_occupied": { bm: "ADA TETAMU", en: "OCCUPIED" },

  // Dashboard Basic View
  "dashboard.welcome": { bm: "Selamat Datang ke Homestay Kenangan 🏡", en: "Welcome to Homestay Kenangan 🏡" },
  "dashboard.welcome_sub": { bm: "Pusat kawalan homestay yang pantas dan mudah. Kemaman 1 & 2 (Terengganu) dan Gong Badak (Kuala Terengganu).", en: "Fast and intuitive property command center for Kemaman 1 & 2 and Gong Badak." },
  "dashboard.btn_register_guest": { bm: "+ Daftar Tetamu Baru", en: "+ Register New Guest" },
  "dashboard.checkin_today": { bm: "Tetamu Masuk Hari Ini", en: "Guests Checking In Today" },
  "dashboard.checkin_none": { bm: "Tiada tetamu baru masuk hari ini.", en: "No guests checking in today." },
  "dashboard.checkin_none_sub": { bm: "Semua bilik yang berpenghuni sedang berjalan seperti biasa.", en: "All occupied units are running smoothly." },
  "dashboard.checkout_today": { bm: "Tetamu Keluar Hari Ini", en: "Guests Checking Out Today" },
  "dashboard.checkout_none": { bm: "Tiada tetamu dijadualkan keluar hari ini.", en: "No guests scheduled to check out today." },
  "dashboard.room_status_today": { bm: "Status Bilik & Sewaan Hari Ini", en: "Room & Rental Status Today" },
  "dashboard.room_status_sub": { bm: "Status ketersediaan Homestay Kenangan Kemaman & Gong Badak.", en: "Current availability for Homestay Kenangan Kemaman & Gong Badak." },
  "dashboard.open_full_calendar": { bm: "Buka Kalendar Penuh", en: "Open Full Calendar" },
  "dashboard.monthly_fixed_rate": { bm: "Sewaan Bilik Bulanan Tetap:", en: "Fixed Monthly Room Rental:" },
  "dashboard.daily_rate_today": { bm: "Kadar Sewaan Hari Ini:", en: "Daily Rate Today:" },

  // Dashboard Pro View
  "dashboard.pro_gross_revenue": { bm: "Jumlah Pendapatan (Bulan Ini)", en: "Gross Revenue (This Month)" },
  "dashboard.pro_total_bookings": { bm: "Jumlah Tempahan Disahkan", en: "Confirmed Reservations" },
  "dashboard.pro_occupancy_rate": { bm: "Kadar Penginapan", en: "Monthly Occupancy Rate" },
  "dashboard.pro_direct_share": { bm: "Tempahan Direct WhatsApp", en: "Direct WhatsApp Share" },
  "dashboard.chart_title": { bm: "Analitik Pendapatan & Trend", en: "Revenue Analytics & Trends" },
  "dashboard.recent_bookings": { bm: "Tempahan Terkini", en: "Recent Reservations" },
  "dashboard.view_all_bookings": { bm: "Lihat Semua Tempahan", en: "View All Reservations" },

  // Calendar
  "calendar.badge": { bm: "MATRIKS KETERSEDIAAN HOMESTAY · KEMAMAN & GONG BADAK", en: "HOMESTAY AVAILABILITY MATRIX · KEMAMAN & GONG BADAK" },
  "calendar.title": { bm: "Kalendar Tempahan & Jadual Bilik", en: "Booking Calendar & Room Schedule" },
  "calendar.subtitle": { bm: "Semak tarikh yang telah ditempah dan kosong dari Januari hingga Disember untuk elak double booking.", en: "Check booked and available dates from January to December to prevent double bookings." },
  "calendar.legend": { bm: "Petunjuk Warna:", en: "Color Legend:" },
  "calendar.legend_direct": { bm: "Direct WhatsApp (Confirmed)", en: "Direct WhatsApp (Confirmed)" },
  "calendar.legend_airbnb": { bm: "Airbnb", en: "Airbnb" },
  "calendar.legend_booking": { bm: "Booking.com", en: "Booking.com" },
  "calendar.legend_monthly": { bm: "Room Rental (Sewa Bulanan)", en: "Room Rental (Monthly)" },
  "calendar.legend_available": { bm: "Kosong (Available)", en: "Available" },
  "calendar.col_unit": { bm: "Unit Homestay", en: "Homestay Unit" },
  "calendar.btn_import": { bm: "Import Planner", en: "Import Planner" },
  "calendar.btn_new_booking": { bm: "Tempahan Baru", en: "New Reservation" },
  "calendar.modal_title": { bm: "Butiran Tempahan", en: "Reservation Details" },
  "calendar.per_month_room": { bm: "/bln (Sewa Bilik)", en: "/mo (Room Rental)" },
  "calendar.per_night": { bm: "/ malam", en: "/ night" },
  "calendar.guest": { bm: "Tetamu", en: "Guest" },
  "calendar.total_price": { bm: "Jumlah Harga", en: "Total Amount" },
  "calendar.deposit": { bm: "Deposit", en: "Deposit" },
  "calendar.payment_status": { bm: "Status Bayaran", en: "Payment Status" },
  "calendar.booking_channel": { bm: "Saluran Tempahan", en: "Booking Channel" },
  "calendar.notes": { bm: "Catatan", en: "Notes" },
  "calendar.close": { bm: "Tutup", en: "Close" },
  "calendar.room_rental_tag": { bm: "Sewa Bilik", en: "Room Rental" },
  "calendar.month_prev": { bm: "Bulan Lepas", en: "Previous Month" },
  "calendar.month_next": { bm: "Bulan Seterusnya", en: "Next Month" },
  "calendar.malam": { bm: "Malam", en: "Nights" },

  // Properties / Rooms & Units
  "properties.title": { bm: "Pengurusan Bilik & Unit", en: "Rooms & Units Management" },
  "properties.subtitle": { bm: "Tetapkan harga, kemudahan, kod smartlock, WiFi dan pautan sync iCal untuk setiap unit.", en: "Configure room capacities, multi-channel pricing, smart locks, WiFi, and iCal calendar feeds." },
  "properties.btn_sync_ical": { bm: "Sync Airbnb & Booking", en: "Sync Airbnb & Booking" },
  "properties.btn_add_unit": { bm: "Tambah Unit Baru", en: "+ Add New Unit" },
  "properties.unit_size": { bm: "Keluasan Unit", en: "Unit Capacity" },
  "properties.bath_toilet": { bm: "Tandas & Bilik Air", en: "Bathrooms & Toilets" },
  "properties.rooms": { bm: "Bilik", en: "Bedrooms" },
  "properties.rate_by_channel": { bm: "Kadar Mengikut Saluran", en: "Multi-Channel Rates" },
  "properties.net_price": { bm: "Harga Bersih", en: "Net Rate" },
  "properties.platform_fee": { bm: "Caj Platform", en: "Platform Fee" },
  "properties.monthly_rental_rate": { bm: "Kadar Sewaan Bulanan (Bilik)", en: "Monthly Rental Rate (Room)" },
  "properties.ical_export_title": { bm: "iCal Export Feed (Airbnb / Booking)", en: "iCal Export Feed (Airbnb / Booking)" },
  "properties.modal_add_title": { bm: "Daftar Unit Homestay Baru", en: "Register New Property Unit" },
  "properties.unit_name": { bm: "Nama Unit / Homestay", en: "Unit / Homestay Name" },
  "properties.unit_type": { bm: "Jenis Sewaan", en: "Rental Type" },
  "properties.type_daily": { bm: "Homestay Harian", en: "Daily Homestay" },
  "properties.type_monthly": { bm: "Sewa Bilik Bulanan", en: "Monthly Room Rental" },
  "properties.address": { bm: "Alamat Lengkap", en: "Full Address" },
  "properties.bedrooms": { bm: "Bilangan Bilik", en: "Number of Bedrooms" },
  "properties.bathrooms": { bm: "Bilangan Tandas / Bilik Air", en: "Number of Bathrooms" },
  "properties.direct_price": { bm: "Harga Direct Booking (RM)", en: "Direct Booking Rate (RM)" },
  "properties.airbnb_price": { bm: "Harga Airbnb (RM)", en: "Airbnb Rate (RM)" },
  "properties.booking_com_price": { bm: "Harga Booking.com (RM)", en: "Booking.com Rate (RM)" },
  "properties.monthly_price": { bm: "Kadar Sewa Bulanan (RM)", en: "Monthly Rental Rate (RM)" },
  "properties.smartlock_code": { bm: "Kod Smartlock (Pilihan)", en: "Smartlock PIN (Optional)" },
  "properties.wifi_ssid": { bm: "Nama WiFi (Pilihan)", en: "WiFi Name (Optional)" },
  "properties.wifi_password": { bm: "Kata Laluan WiFi (Pilihan)", en: "WiFi Password (Optional)" },
  "properties.save_unit": { bm: "Simpan Unit", en: "Save Unit" },
  "properties.cancel": { bm: "Batal", en: "Cancel" },

  // Bookings Page
  "bookings.title": { bm: "Pengurusan Tempahan", en: "Reservation Management" },
  "bookings.subtitle": { bm: "Senarai penuh semua rekod tempahan dari Direct WhatsApp, Airbnb, dan Booking.com.", en: "Complete list of all reservations from Direct WhatsApp, Airbnb, and Booking.com." },
  "bookings.search_placeholder": { bm: "Cari nama tetamu, no telefon, atau unit...", en: "Search guest name, phone, or unit..." },
  "bookings.all_channels": { bm: "Semua Saluran", en: "All Channels" },
  "bookings.all_statuses": { bm: "Semua Status", en: "All Statuses" },
  "bookings.col_guest": { bm: "Tetamu", en: "Guest" },
  "bookings.col_property": { bm: "Unit Homestay", en: "Property Unit" },
  "bookings.col_dates": { bm: "Tarikh Menginap", en: "Stay Dates" },
  "bookings.col_nights": { bm: "Malam", en: "Nights" },
  "bookings.col_channel": { bm: "Saluran", en: "Channel" },
  "bookings.col_total": { bm: "Jumlah (RM)", en: "Total (RM)" },
  "bookings.col_payment": { bm: "Bayaran", en: "Payment" },
  "bookings.col_status": { bm: "Status", en: "Status" },
  "bookings.col_actions": { bm: "Tindakan", en: "Actions" },

  // New Booking Form
  "new_booking.title": { bm: "Daftar Tempahan Baru", en: "Register New Reservation" },
  "new_booking.subtitle": { bm: "Masukkan butiran tetamu dan tarikh penginapan untuk merekod tempahan.", en: "Enter guest details and stay dates to record a new reservation." },
  "new_booking.guest_info": { bm: "Maklumat Tetamu", en: "Guest Information" },
  "new_booking.guest_name": { bm: "Nama Penuh Tetamu", en: "Full Guest Name" },
  "new_booking.guest_phone": { bm: "Nombor Telefon (WhatsApp)", en: "Phone Number (WhatsApp)" },
  "new_booking.guest_ic": { bm: "No. Kad Pengenalan / Pasport (Pilihan)", en: "IC / Passport Number (Optional)" },
  "new_booking.stay_details": { bm: "Butiran Penginapan", en: "Stay Details" },
  "new_booking.select_property": { bm: "Pilih Unit Homestay", en: "Select Property Unit" },
  "new_booking.checkin_date": { bm: "Tarikh Check-In", en: "Check-In Date" },
  "new_booking.checkout_date": { bm: "Tarikh Check-Out", en: "Check-Out Date" },
  "new_booking.total_nights": { bm: "Jumlah Malam", en: "Total Nights" },
  "new_booking.total_rate": { bm: "Jumlah Harga (RM)", en: "Total Amount (RM)" },
  "new_booking.deposit": { bm: "Wang Deposit Keselamatan (RM)", en: "Security Deposit (RM)" },
  "new_booking.source": { bm: "Sumber Tempahan", en: "Booking Channel / Source" },
  "new_booking.payment_status": { bm: "Status Bayaran", en: "Payment Status" },
  "new_booking.notes": { bm: "Nota Tambahan / Catatan", en: "Additional Notes / Comments" },
  "new_booking.btn_submit": { bm: "Simpan & Rekod Tempahan", en: "Save & Record Reservation" },

  // Guests Directory
  "guests.title": { bm: "Direktori Tetamu", en: "Guests Directory" },
  "guests.subtitle": { bm: "Pangkalan data tetamu yang pernah menginap di Homestay Kenangan.", en: "Database of all guests who have stayed at Homestay Kenangan." },
  "guests.search": { bm: "Cari nama tetamu atau nombor telefon...", en: "Search guest name or phone number..." },
  "guests.col_name": { bm: "Nama Tetamu", en: "Guest Name" },
  "guests.col_phone": { bm: "No Telefon", en: "Phone Number" },
  "guests.col_history": { bm: "Sejarah / Nota", en: "History / Notes" },

  // WhatsApp
  "whatsapp.title": { bm: "Templat WhatsApp & Mesej Automatik", en: "WhatsApp Templates & Messaging" },
  "whatsapp.subtitle": { bm: "Hantar arahan check-in, kod smartlock, dan pengesahan tempahan terus ke WhatsApp tetamu dengan satu klik.", en: "Send check-in instructions, smartlock PINs, and booking confirmations to guests with one click." },
  "whatsapp.header_title": { bm: "Penjana Mesej Rasmi & Resit WhatsApp", en: "Official Message & WhatsApp Receipt Generator" },
  "whatsapp.header_desc": { bm: "Jana draf mesej arahan masuk, passcode smartlock, dan resit bayaran dalam 1-klik terus ke WhatsApp tetamu.", en: "Generate check-in guides, smartlock passcodes, and payment receipts in 1-click directly to guest WhatsApp." },
  "whatsapp.step1_title": { bm: "1. Pilih Tempahan Tetamu", en: "1. Select Guest Reservation" },
  "whatsapp.step2_title": { bm: "2. Pilih Jenis Templat", en: "2. Select Template Type" },
  "whatsapp.tpl_checkin_title": { bm: "Arahan Check-In & Smartlock", en: "Check-In Guide & Smartlock" },
  "whatsapp.tpl_checkin_desc": { bm: "Passcode pintu, WiFi, alamat & waktu masuk", en: "Door passcode, WiFi, address & check-in time" },
  "whatsapp.tpl_confirm_title": { bm: "Pengesahan Tempahan", en: "Booking Confirmation" },
  "whatsapp.tpl_confirm_desc": { bm: "Butiran tarikh, sewa & resit deposit", en: "Stay dates, rental rate & deposit receipt" },
  "whatsapp.tpl_reminder_title": { bm: "Peringatan Baki Bayaran", en: "Payment Balance Reminder" },
  "whatsapp.tpl_reminder_desc": { bm: "Peringatan baki sewaan yang belum lunas", en: "Reminder for remaining unpaid rental balance" },
  "whatsapp.tpl_checkout_title": { bm: "Terima Kasih & Check-Out", en: "Thank You & Check-Out" },
  "whatsapp.tpl_checkout_desc": { bm: "Peringatan waktu keluar & pemulangan deposit", en: "Check-out reminder & deposit refund" },
  "whatsapp.preview_title": { bm: "Pratonton Teks WhatsApp", en: "WhatsApp Message Preview" },
  "whatsapp.copy_btn": { bm: "Salin Mesej", en: "Copy Message" },
  "whatsapp.copied_btn": { bm: "Disalin!", en: "Copied!" },
  "whatsapp.phone_label": { bm: "No. Telefon WhatsApp Tetamu", en: "Guest WhatsApp Phone Number" },
  "whatsapp.content_label": { bm: "Kandungan Mesej", en: "Message Content" },
  "whatsapp.btn_open_app": { bm: "Buka di WhatsApp Web / App", en: "Open in WhatsApp Web / App" },

  // Import
  "import.badge": { bm: "MIGRASI DATA PENUH (JANUARI - SEKARANG)", en: "FULL DATA MIGRATION (JANUARY - PRESENT)" },
  "import.title_part1": { bm: "Import Penuh", en: "Full Import" },
  "import.title_part2": { bm: "Booking Planner", en: "Booking Planner" },
  "import.desc": { bm: "Pindahkan rekod tempahan lengkap dari Google AI Studio bagi Kemaman 1, Kemaman 2, dan Gong Badak ke dalam sistem ERP. Tarikh berturutan akan automatik digabungkan menjadi tempahan sebenar.", en: "Transfer complete reservation records from Google AI Studio for Kemaman 1, Kemaman 2, and Gong Badak into the ERP system. Consecutive dates are automatically merged into single reservations." },
  "import.open_api_btn": { bm: "Buka Link API Planner", en: "Open Planner API Link" },
  "import.success_title": { bm: "Import Penuh Berjaya!", en: "Full Import Successful!" },
  "import.success_desc": { bm: "Semua rekod tempahan dari Januari hingga sekarang telah dimasukkan.", en: "All reservation records from January to present have been imported." },
  "import.view_calendar": { bm: "Lihat di Kalendar →", en: "View in Calendar →" },
  "import.to_dashboard": { bm: "Ke Dashboard", en: "To Dashboard" },
  "import.stat_total_bookings": { bm: "Jumlah Tempahan", en: "Total Reservations" },
  "import.stat_total_nights": { bm: "Jumlah Malam Ditempah", en: "Total Booked Nights" },
  "import.stat_breakdown": { bm: "Pecahan Unit Homestay", en: "Unit Breakdown" },
  "import.steps_title": { bm: "3 Langkah Mudah Memindahkan Semua Data:", en: "3 Easy Steps to Transfer All Data:" },
  "import.step1_title": { bm: "Buka Link Data Planner", en: "Open Planner Data Link" },
  "import.step1_desc": { bm: "Klik butang di bawah untuk buka data JSON Booking Planner anda di tab baru pelayar.", en: "Click the button below to open your Booking Planner JSON data in a new browser tab." },
  "import.step1_link": { bm: "Buka Tab Data Booking Planner", en: "Open Booking Planner Tab" },
  "import.step2_title": { bm: "Salin Semua Teks (Copy)", en: "Copy All Text" },
  "import.step2_desc": { bm: "Di tab baru yang terbuka, tekan Ctrl + A (Select All), kemudian tekan Ctrl + C (Copy).", en: "In the newly opened tab, press Ctrl + A (Select All), then press Ctrl + C (Copy)." },
  "import.step3_title": { bm: "Tampal & Tekan Import", en: "Paste & Click Import" },
  "import.step3_desc": { bm: "Tampal (Ctrl + V) ke dalam kotak teks di sebelah dan tekan butang hijau. Sistem automatik menyusun tempahan mengikut tarikh sebenar!", en: "Paste (Ctrl + V) into the box on the right and click the button. The system automatically merges consecutive dates into real bookings!" },
  "import.paste_title": { bm: "Kotak Tampal Data (JSON)", en: "Data Paste Box (JSON)" },
  "import.paste_desc": { bm: "Tampal teks JSON yang disalin dari Google AI Studio di sini.", en: "Paste the JSON text copied from Google AI Studio here." },
  "import.use_sample": { bm: "Guna Data Sepenuh Tahun (Contoh)", en: "Use Full-Year Sample Data" },
  "import.placeholder": { bm: "Tampal data JSON Booking Planner anda di sini... (Ctrl + V)", en: "Paste your Booking Planner JSON data here... (Ctrl + V)" },
  "import.note_merge": { bm: "*Tarikh berturutan dengan tetamu sama akan automatik digabungkan.", en: "*Consecutive dates for the same guest will be automatically merged." },
  "import.btn_importing": { bm: "Sedang Memproses Rekod...", en: "Processing Records..." },
  "import.btn_import_all": { bm: "Import Semua Tempahan (Jan - Sekarang)", en: "Import All Bookings (Jan - Present)" },
  "import.unit_resv": { bm: "tempahan", en: "resv" },
  "import.unit_nights": { bm: "malam", en: "nights" },

  // Settings
  "settings.title": { bm: "Tetapan Sistem & Konfigurasi Supabase", en: "System Settings & Supabase Configuration" },
  "settings.subtitle": { bm: "Status sambungan awan, persekitaran deployment Coolify, dan pangkalan data.", en: "Cloud connection status, Coolify deployment environment, and database." },
  "settings.card_title": { bm: "Status Pangkalan Data Supabase", en: "Supabase Database Status" },
  "settings.active_status": { bm: "Pautan API dikesan aktif", en: "API connection active" },
  "settings.demo_status": { bm: "Mod Demo / Local Storage", en: "Demo / Local Storage Mode" },
  "settings.btn_testing": { bm: "Menguji...", en: "Testing..." },
  "settings.btn_test": { bm: "Uji Sambungan Database", en: "Test Database Connection" },
  "settings.guide_title": { bm: "Cara Memasukkan Kunci Supabase:", en: "How to Configure Supabase Keys:" },
  "settings.guide_desc": { bm: "Buka fail .env.local di dalam folder projek (atau masukkan di bahagian Environment Variables dalam dashboard Coolify):", en: "Open the .env.local file in the project folder (or add in Environment Variables inside Coolify dashboard):" },
  "settings.arch_title": { bm: "Maklumat Seni Bina Deployment (RM0 Stack)", en: "Deployment Architecture Details (RM0 Stack)" },
  "settings.arch_vps": { bm: "VPS Server:", en: "VPS Server:" },
  "settings.arch_paas": { bm: "PaaS Manager:", en: "PaaS Manager:" },
  "settings.arch_db": { bm: "Database:", en: "Database:" },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "bm",
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bm");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("damai_erp_lang") as Language | null;
      if (saved === "bm" || saved === "en") {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("damai_erp_lang", lang);
      window.dispatchEvent(new Event("language_change"));
    }
  };

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
