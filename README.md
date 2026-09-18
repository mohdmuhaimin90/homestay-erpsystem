# 🏡 Sistem ERP Homestay Keluarga (RM0 Stack)

Aplikasi Pengurusan Homestay (Property Management System & Booking Planner) berasaskan **Next.js 15**, **Supabase (PostgreSQL)**, dan **Coolify** yang dihoskan secara **100% PERCUMA (RM0)** di atas Oracle Cloud Always Free VPS.

---

## 🚀 Ciri-Ciri Utama

1. 📊 **Dashboard Eksekutif**: Pantau jumlah pendapatan, tempahan aktif, kadar penghunian, serta senarai tetamu yang mendaftar masuk (*check-in*) dan keluar (*check-out*) hari ini.
2. 📅 **Kalendar Tempahan (Booking Planner Matrix)**: Paparan matriks visual kekosongan bilik mengikut tarikh untuk mengelakkan pertindihan tempahan (*double-booking*).
3. 📝 **Pengurusan Tempahan & Tetamu**: Borang daftar sewaan dengan auto-kira malam & harga, penjejak status bayaran (*Deposit Paid, Fully Paid, Unpaid*).
4. 💬 **Penjana WhatsApp Pintar**: Butang 1-klik untuk menghantar arahan *check-in*, nombor passcode smartlock, kata laluan WiFi, dan pengesahan tempahan kepada tetamu.
5. 📥 **Alat Migrasi Firebase**: Pindahkan semua data tempahan lama dari Firebase Google AI Studio terus ke pangkalan data Supabase.
6. 🐳 **Sedia untuk Coolify**: Dilengkapi dengan `Dockerfile` (multi-stage build standalone) yang sangat pantas untuk CPU ARM64 / x86_64 di Oracle VPS.

---

## 🛠️ Langkah Menjalankan Aplikasi Secara Lokal

1. **Pasang Dependencies**:
   ```bash
   npm install
   ```

2. **Tetapkan Fail Environment**:
   Salin `.env.example` kepada `.env.local` dan masukkan kunci Supabase anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
   ```

3. **Jalankan Pembangunan (Dev Server)**:
   ```bash
   npm run dev
   ```
   Buka pelayar web di `http://localhost:3000`.

---

## ☁️ Panduan Deployment ke Coolify (Oracle Free Tier VPS)

### Langkah 1: Pasang Coolify di VPS Oracle (Jika Belum)
Log masuk ke VPS Oracle anda melalui SSH dan jalankan:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Buka dashboard Coolify di `http://<IP-VPS-ANDA>:8000`.

### Langkah 2: Push Kod ke GitHub
1. Buat repository baru di GitHub (contoh: `homestay-erp`).
2. Jalankan arahan berikut di terminal komputer anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Homestay ERP"
   git branch -M main
   git remote add origin https://github.com/USERNAME/homestay-erp.git
   git push -u origin main
   ```

### Langkah 3: Tambah Resource di Coolify
1. Di Coolify Dashboard, klik **New Resource** > **Application** > **GitHub App / Public Repository**.
2. Pilih repository `homestay-erp`.
3. Di bahagian **Environment Variables**, masukkan:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Di bahagian **Domains**, masukkan domain anda (contoh: `https://homestay.domainanda.com` atau `https://app.IP-VPS.sslip.io`).
5. Klik **Deploy**!
