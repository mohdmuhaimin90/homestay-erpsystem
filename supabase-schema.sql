-- ======================================================================
-- SKEMA PANGKALAN DATA SUPABASE: SISTEM ERP HOMESTAY
-- Jalankan skrip ini di SQL Editor dalam Supabase Dashboard anda.
-- ======================================================================

-- 1. JADUAL UNIT HOMESTAY (PROPERTIES)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    base_price_per_night NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cleaning_fee NUMERIC(10, 2) DEFAULT 0.00,
    deposit_amount NUMERIC(10, 2) DEFAULT 100.00,
    total_rooms INT DEFAULT 1,
    max_guests INT DEFAULT 2,
    smartlock_code VARCHAR(50) DEFAULT '1234#',
    wifi_ssid VARCHAR(100),
    wifi_password VARCHAR(100),
    waze_url TEXT,
    google_maps_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'maintenance', 'inactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. JADUAL MAKLUMAT TETAMU (GUESTS)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    ic_passport VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. JADUAL TEMPAHAN (BOOKINGS)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_nights INT GENERATED ALWAYS AS (check_out - check_in) STORED,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    source VARCHAR(50) DEFAULT 'direct_whatsapp', -- 'direct_whatsapp', 'airbnb', 'booking_com', 'agoda', 'other'
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'deposit_paid', 'fully_paid', 'refunded'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (check_out > check_in)
);

-- 4. JADUAL PEMBAYARAN (PAYMENTS)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'deposit', -- 'deposit', 'balance', 'full_payment', 'refund'
    payment_method VARCHAR(50) DEFAULT 'online_transfer', -- 'online_transfer', 'cash', 'qr_pay', 'card'
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. JADUAL PERBELANJAAN (EXPENSES)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'cleaning', -- 'cleaning', 'maintenance', 'utilities', 'supplies', 'other'
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- INDEKS PANTAS PANGKALAN DATA (DATABASE INDEXES FOR HIGH PERFORMANCE)
-- ======================================================================
-- 1. Index komposit carian tarikh & unit bagi kalendar & dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates ON bookings (property_id, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_checkin_checkout ON bookings (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_checkin ON bookings (check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings (guest_id);

-- 2. Index carian direktori tetamu (nama & telefon)
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests (phone);
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests (name);

-- 3. Index pembayaran & perbelanjaan
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_date ON expenses (property_id, expense_date);

-- Data Awalan Homestay Kenangan
INSERT INTO properties (id, name, address, base_price_per_night, price_direct, price_airbnb, price_bookingcom, cleaning_fee, deposit_amount, total_rooms, max_guests, smartlock_code, wifi_ssid, wifi_password, google_maps_url, status)
VALUES 
('107a4fd3-004b-47e6-9836-4ec6c9fdbc34', 'Homestay Kenangan Kemaman 1', 'Chukai, Kemaman, Terengganu (Rumah Belakang)', 0.00, 0.00, 0.00, 0.00, 0.00, 700.00, 2, 4, '8899#', 'HomestayKenangan_Kemaman', 'kenangan2026!', 'https://maps.app.goo.gl/KyBmg1iwgqLiSsha9', 'active'),
('107a4fd3-004b-47e6-9836-4ec6c9fdbc35', 'Homestay Kenangan Kemaman 2', 'Chukai, Kemaman, Terengganu (Rumah Depan)', 180.00, 180.00, 215.00, 225.00, 40.00, 100.00, 3, 8, '4422#', 'HomestayKenangan_Kemaman', 'kenangan2026!', 'https://maps.app.goo.gl/KyBmg1iwgqLiSsha9', 'active'),
('74b22955-e2e7-4a84-b18c-074b73ab1825', 'Homestay Kenangan Gong Badak', 'Gong Badak, Kuala Terengganu, Terengganu', 350.00, 350.00, 395.00, 410.00, 60.00, 150.00, 4, 12, '1234#', 'HomestayKenangan_KT', 'kenangan2026!', 'https://maps.app.goo.gl/SCBDByiRjyYQefny6', 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  base_price_per_night = EXCLUDED.base_price_per_night;

-- Tambahan lajur untuk iCal 2-Way Sync & Kadar Saluran (Airbnb & Booking.com)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bookingcom_ical_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_direct NUMERIC(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_airbnb NUMERIC(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_bookingcom NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ical_uid TEXT;

-- ======================================================================
-- POLISI ROW LEVEL SECURITY (RLS) UNTUK APLIKASI ERP HOMESTAY
-- Memastikan kunci API anon/service dapat membaca & menulis rekod dengan lancar
-- ======================================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public all for properties" ON properties;
    CREATE POLICY "Allow public all for properties" ON properties FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public all for guests" ON guests;
    CREATE POLICY "Allow public all for guests" ON guests FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public all for bookings" ON bookings;
    CREATE POLICY "Allow public all for bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public all for payments" ON payments;
    CREATE POLICY "Allow public all for payments" ON payments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public all for expenses" ON expenses;
    CREATE POLICY "Allow public all for expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
END $$;


