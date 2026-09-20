import { Property, Guest, Booking } from "./types";

export const mockProperties: Property[] = [
  {
    id: "kemaman-1",
    name: "Homestay Kenangan Kemaman 1",
    address: "Chukai, Kemaman, Terengganu (Rumah Belakang)",
    rental_type: "monthly",
    monthly_rental_rate: 700,
    base_price_per_night: 0,
    price_direct: 0,
    price_airbnb: 0,
    price_bookingcom: 0,
    cleaning_fee: 0,
    deposit_amount: 700,
    total_rooms: 2,
    total_bathrooms: 1,
    total_toilets: 1,
    max_guests: 4,
    smartlock_code: "8899#",
    wifi_ssid: "HomestayKenangan_Kemaman",
    wifi_password: "kenangan2026!",
    google_maps_url: "https://maps.app.goo.gl/KyBmg1iwgqLiSsha9",
    notes: "Kini dijadikan sewaan bilik bulanan (Room Rental) - RM 700 / bulan. Rumah belakang.",
    status: "active",
  },
  {
    id: "kemaman-2",
    name: "Homestay Kenangan Kemaman 2",
    address: "Chukai, Kemaman, Terengganu (Rumah Depan)",
    rental_type: "daily",
    base_price_per_night: 180,
    price_direct: 180,       // Direct WhatsApp
    price_airbnb: 215,       // Airbnb (caj platform)
    price_bookingcom: 225,   // Booking.com (caj OTA)
    cleaning_fee: 40,
    deposit_amount: 100,
    total_rooms: 3,
    total_bathrooms: 1,
    total_toilets: 1,
    max_guests: 8,
    smartlock_code: "4422#",
    wifi_ssid: "HomestayKenangan_Kemaman",
    wifi_password: "kenangan2026!",
    google_maps_url: "https://maps.app.goo.gl/KyBmg1iwgqLiSsha9",
    notes: "Rumah depan (3 bilik, 1 toilet, 1 bathroom). Lokasi & kemudahan sama dengan Kemaman 1.",
    status: "active",
  },
  {
    id: "gong-badak",
    name: "Homestay Kenangan Gong Badak",
    address: "Gong Badak, Kuala Terengganu, Terengganu",
    rental_type: "daily",
    base_price_per_night: 350,
    price_direct: 350,       // Direct WhatsApp
    price_airbnb: 395,       // Airbnb
    price_bookingcom: 410,   // Booking.com
    cleaning_fee: 60,
    deposit_amount: 150,
    total_rooms: 4,
    total_bathrooms: 4,
    total_toilets: 4,
    max_guests: 12,
    smartlock_code: "1234#",
    wifi_ssid: "HomestayKenangan_KT",
    wifi_password: "kenangan2026!",
    google_maps_url: "https://maps.app.goo.gl/SCBDByiRjyYQefny6",
    notes: "Rumah banglo luas 4 bilik, 4 bathroom. Dekat pantai, airport & universiti.",
    status: "active",
  },
];

export const mockGuests: Guest[] = [];

export const mockBookings: Booking[] = [];