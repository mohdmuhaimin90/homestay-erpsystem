export interface Property {
  id: string;
  name: string;
  address?: string;
  rental_type?: 'daily' | 'monthly'; // 'daily' (homestay) atau 'monthly' (room rental cth: Kemaman 1 RM700)
  monthly_rental_rate?: number;      // cth: 700
  base_price_per_night: number;     // default
  price_direct?: number;            // Direct WhatsApp rate (tanpa komisen)
  price_airbnb?: number;            // Airbnb rate (termasuk komisen platform)
  price_bookingcom?: number;        // Booking.com rate (termasuk komisen OTA)
  cleaning_fee?: number;
  deposit_amount?: number;
  total_rooms?: number;
  total_bathrooms?: number;
  total_toilets?: number;
  max_guests?: number;
  smartlock_code?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  waze_url?: string;
  google_maps_url?: string;
  airbnb_ical_url?: string;
  bookingcom_ical_url?: string;
  notes?: string;
  status: 'active' | 'maintenance' | 'inactive';
  created_at?: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  ic_passport?: string;
  notes?: string;
  created_at?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded';
export type BookingSource = 'direct_whatsapp' | 'airbnb' | 'booking_com' | 'agoda' | 'other';

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  total_nights: number;
  total_price: number;
  deposit_amount: number;
  source: BookingSource;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  ical_uid?: string;
  notes?: string;
  created_at?: string;
  property?: Property;
  guest?: Guest;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_type: 'deposit' | 'balance' | 'full_payment' | 'refund';
  payment_method: 'online_transfer' | 'cash' | 'qr_pay' | 'card';
  payment_date: string;
  receipt_url?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  property_id?: string;
  title: string;
  category: 'cleaning' | 'maintenance' | 'utilities' | 'supplies' | 'other';
  amount: number;
  expense_date: string;
  notes?: string;
  created_at?: string;
}