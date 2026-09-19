import { Property, Guest, Booking } from "./types";

export const mockProperties: Property[] = [
  {
    id: "prop-1",
    name: "Villa A - Poolside Garden",
    address: "No. 12, Jalan Damai 3, Kajang, Selangor",
    base_price_per_night: 280,
    price_direct: 260,       // Direct WhatsApp tanpa komisen
    price_airbnb: 310,       // Airbnb (caj platform ~15%)
    price_bookingcom: 320,   // Booking.com (caj OTA ~18%)
    cleaning_fee: 50,
    deposit_amount: 100,
    total_rooms: 3,
    max_guests: 8,
    smartlock_code: "8899#",
    wifi_ssid: "VillaDamai_5G",
    wifi_password: "damai2026!",
    status: "active",
  },
  {
    id: "prop-2",
    name: "Chalet B - Romantic Suite",
    address: "No. 14, Jalan Damai 3, Kajang, Selangor",
    base_price_per_night: 180,
    price_direct: 170,       // Direct WhatsApp
    price_airbnb: 200,       // Airbnb
    price_bookingcom: 215,   // Booking.com
    cleaning_fee: 30,
    deposit_amount: 50,
    total_rooms: 1,
    max_guests: 3,
    smartlock_code: "4422#",
    wifi_ssid: "ChaletSuite_WiFi",
    wifi_password: "suiteguest123",
    status: "active",
  },
  {
    id: "prop-3",
    name: "Homestay C - Family Classic",
    address: "No. 16, Jalan Damai 3, Kajang, Selangor",
    base_price_per_night: 350,
    price_direct: 330,       // Direct WhatsApp
    price_airbnb: 390,       // Airbnb
    price_bookingcom: 410,   // Booking.com
    cleaning_fee: 60,
    deposit_amount: 150,
    total_rooms: 4,
    max_guests: 12,
    smartlock_code: "1234#",
    wifi_ssid: "FamilyClassic_Guest",
    wifi_password: "keluargabahagia",
    status: "active",
  },
];

export const mockGuests: Guest[] = [
  {
    id: "gst-1",
    name: "Ahmad Farhan",
    phone: "0134567890",
    email: "farhan@example.com",
    notes: "Family gathering (8 pax)",
  },
  {
    id: "gst-2",
    name: "Nurul Huda",
    phone: "0198765432",
    email: "huda@example.com",
    notes: "Repeat guest - minta extra pillow",
  },
  {
    id: "gst-3",
    name: "Tan Wei Lun",
    phone: "0123344556",
    email: "weilun@example.com",
    notes: "Booking via WhatsApp Direct",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "bk-101",
    property_id: "prop-1",
    guest_id: "gst-1",
    check_in: "2026-09-19",
    check_out: "2026-09-21",
    total_nights: 2,
    total_price: 570,
    deposit_amount: 100,
    source: "direct_whatsapp",
    booking_status: "confirmed",
    payment_status: "deposit_paid",
    notes: "Dah bayar deposit RM100 via Online Transfer.",
    property: mockProperties[0],
    guest: mockGuests[0],
  },
  {
    id: "bk-102",
    property_id: "prop-2",
    guest_id: "gst-2",
    check_in: "2026-09-20",
    check_out: "2026-09-22",
    total_nights: 2,
    total_price: 430,
    deposit_amount: 50,
    source: "airbnb",
    booking_status: "checked_in",
    payment_status: "fully_paid",
    notes: "Airbnb reservation HM89231",
    property: mockProperties[1],
    guest: mockGuests[1],
  },
  {
    id: "bk-103",
    property_id: "prop-3",
    guest_id: "gst-3",
    check_in: "2026-09-25",
    check_out: "2026-09-27",
    total_nights: 2,
    total_price: 720,
    deposit_amount: 150,
    source: "booking_com",
    booking_status: "confirmed",
    payment_status: "deposit_paid",
    notes: "Booking.com #984210",
    property: mockProperties[2],
    guest: mockGuests[2],
  },
];