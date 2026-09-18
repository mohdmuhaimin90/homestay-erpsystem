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

-- Index pantas untuk carian tarikh
CREATE INDEX IF NOT EXISTS idx_bookings_property_dates ON bookings (property_id, check_in, check_out);

-- Sample Data Awalan (Boleh dipadam jika tidak mahu)
INSERT INTO properties (name, address, base_price_per_night, cleaning_fee, deposit_amount, total_rooms, max_guests, smartlock_code, wifi_ssid, wifi_password)
VALUES 
('Villa A - Poolside Garden', 'No. 12, Jalan Damai 3, 43000 Kajang, Selangor', 280.00, 50.00, 100.00, 3, 8, '8899#', 'VillaDamai_5G', 'damai2026!'),
('Chalet B - Romantic Suite', 'No. 14, Jalan Damai 3, 43000 Kajang, Selangor', 180.00, 30.00, 50.00, 1, 3, '4422#', 'ChaletSuite_WiFi', 'suiteguest123'),
('Homestay C - Family Classic', 'No. 16, Jalan Damai 3, 43000 Kajang, Selangor', 350.00, 60.00, 150.00, 4, 12, '1234#', 'FamilyClassic_Guest', 'keluargabahagia')
ON CONFLICT DO NOTHING;
-- Tambahan lajur untuk iCal 2-Way Sync (Airbnb & Booking.com)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bookingcom_ical_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ical_uid TEXT;
