# 📘 Buku Pedoman Pengguna AquaLink

## Panduan Lengkap untuk Pelanggan Website

---

## 🎯 Selamat Datang di AquaLink!

AquaLink adalah sistem meteran air pintar berbasis **website** yang membantu Anda memantau penggunaan air secara **real-time**. Dengan AquaLink, Anda dapat:

- 📊 Melihat penggunaan air secara langsung
- 💰 Memantau tagihan air bulanan
- 🔔 Mendapat notifikasi penting
- 💳 Membayar tagihan dengan mudah via Midtrans
- 📈 Melihat riwayat penggunaan air dengan grafik interaktif
- 🏠 Mengajukan permohonan pemasangan meteran baru

---

## 🌐 Cara Memulai

### 1. Akses Website AquaLink

```
URL: https://aqualink.site
```

- Buka browser (Chrome, Firefox, Edge, Safari)
- Ketik: **https://aqualink.site**
- Atau klik link dari email undangan

### 2. Registrasi Akun Baru

1. Di halaman utama, klik tombol **"Daftar"** atau **"Register"**
2. Isi form registrasi:
   ```
   Nama Lengkap: [Nama Anda]
   Email: [email@example.com]
   Password: [minimal 6 karakter]
   Konfirmasi Password: [ketik ulang password]
   No. HP: [08123456789]
   ```
3. Centang **"Saya setuju dengan syarat dan ketentuan"**
4. Klik **"Daftar"**
5. Cek email Anda untuk link verifikasi
6. Klik link verifikasi untuk aktivasi akun

### 3. Login ke Akun

1. Klik tombol **"Masuk"** atau **"Login"**
2. Masukkan:
   - Email: [email Anda]
   - Password: [password Anda]
3. Klik **"Masuk"**

**Alternatif Login:**

- Klik **"Login dengan Google"** untuk login cepat

---

## 🏠 Dashboard Beranda

Setelah login, Anda akan masuk ke halaman **Beranda** dengan informasi:

```
┌─────────────────────────────────────────────────────┐
│  🏠 Beranda - Selamat Datang, [Nama Anda]          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  💧 Penggunaan Hari Ini                             │
│  ┌─────────────────────────────────┐               │
│  │  245.5 Liter                    │               │
│  │  📊 Grafik real-time            │               │
│  └─────────────────────────────────┘               │
│                                                     │
│  📅 Penggunaan Bulan Ini                            │
│  ┌─────────────────────────────────┐               │
│  │  5,420 Liter (15.2 m³)          │               │
│  │  [Grafik bulanan]               │               │
│  └─────────────────────────────────┘               │
│                                                     │
│  💰 Tagihan Bulan Ini                               │
│  ┌─────────────────────────────────┐               │
│  │  Rp 125.000                     │               │
│  │  Status: Belum Dibayar          │               │
│  │  Jatuh Tempo: 10 Feb 2025       │               │
│  │  [Bayar Sekarang]               │               │
│  └─────────────────────────────────┘               │
│                                                     │
│  📊 Aktivitas Terbaru                               │
│  • 14 Jan 10:30 - Penggunaan 12.5 L                │
│  • 14 Jan 10:00 - Penggunaan 8.3 L                 │
│  • 14 Jan 09:30 - Penggunaan 15.7 L                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Menu Navigasi Utama:

- **Beranda** - Dashboard utama
- **Monitoring** - Monitoring penggunaan real-time
- **Usage** - Grafik penggunaan detail
- **Billing** - Tagihan dan riwayat pembayaran
- **Notifikasi** - Pesan dan alert
- **Profile** - Pengaturan akun dan data koneksi
- **FAQ** - Bantuan dan pertanyaan umum
- **Lapor Kebocoran** - Laporkan masalah

---

## 📊 Halaman Usage (Penggunaan Air)

### Melihat Grafik Penggunaan Detail:

1. Klik menu **"Usage"** di sidebar
2. Pilih filter periode:
   ```
   [Hari Ini ▼] [Minggu Ini ▼] [Bulan Ini ▼] [Tahun Ini ▼]
   ```

### Tampilan Grafik:

```
📊 Penggunaan Air - Hari Ini

Total Penggunaan: 245.5 L
Status: Normal ✅

[Grafik Line Chart]
┌────────────────────────────────────┐
│ 30L│     ╭─╮                       │
│    │   ╭─╯ ╰─╮                     │
│ 20L│ ╭─╯     ╰─╮                   │
│    │─╯         ╰──────             │
│ 0L └─────────────────────────────  │
│    06:00  09:00  12:00  15:00  18:00│
└────────────────────────────────────┘

📈 Statistik:
• Penggunaan Tertinggi: 28.5 L (06:30)
• Penggunaan Terendah: 2.1 L (14:00)
• Rata-rata per Jam: 10.2 L
```

### Tips Membaca Grafik:

- **Puncak pagi (06:00-09:00)**: Mandi, cuci
- **Siang (12:00-14:00)**: Memasak
- **Sore (17:00-20:00)**: Mandi sore, cuci piring
- **Malam (21:00-06:00)**: Minimal (hanya toilet)

⚠️ **Jika ada penggunaan tinggi malam hari → Kemungkinan kebocoran!**

---

## 💰 Halaman Billing & Pembayaran

### 1. Melihat Tagihan

1. Klik menu **"Billing"**
2. Lihat daftar tagihan:

```
💰 Tagihan Air

┌─────────────────────────────────────────────────┐
│ 📄 Tagihan Januari 2025                        │
│ Periode: 1-31 Januari 2025                     │
│ Penggunaan: 15.2 m³                            │
│ Biaya Air: Rp 110.000                          │
│ Biaya Admin: Rp 5.000                          │
│ Biaya Beban: Rp 10.000                         │
│ ─────────────────────────────                  │
│ TOTAL: Rp 125.000                              │
│                                                 │
│ Status: 🟡 Belum Dibayar                       │
│ Jatuh Tempo: 10 Februari 2025                  │
│                                                 │
│ [Lihat Detail] [Bayar Sekarang]                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📄 Tagihan Desember 2024                       │
│ Status: ✅ Lunas                                │
│ Dibayar: 5 Januari 2025                        │
│ Total: Rp 118.500                              │
│ [Lihat Detail]                                  │
└─────────────────────────────────────────────────┘
```

### 2. Cara Membayar Tagihan

#### Step 1: Pilih Tagihan

1. Klik **"Bayar Sekarang"** pada tagihan yang ingin dibayar
2. Akan masuk ke halaman **"Pembayaran"**

#### Step 2: Pilih Metode Pembayaran

Website AquaLink menggunakan **Midtrans Payment Gateway**:

```
💳 Pilih Metode Pembayaran

┌─────────────────────────────────────┐
│ 🏦 Transfer Bank Virtual Account    │
│ • BCA Virtual Account               │
│ • Mandiri Virtual Account           │
│ • BNI Virtual Account               │
│ • BRI Virtual Account               │
│ • Permata Virtual Account           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💳 Kartu Kredit/Debit               │
│ • Visa                              │
│ • Mastercard                        │
│ • JCB                               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📱 E-Wallet                         │
│ • GoPay                             │
│ • ShopeePay                         │
│ • QRIS                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏪 Gerai Retail                     │
│ • Indomaret                         │
│ • Alfamart                          │
└─────────────────────────────────────┘
```

#### Step 3: Proses Pembayaran

**Contoh: Transfer BCA Virtual Account**

1. Pilih **"BCA Virtual Account"**
2. Sistem generate nomor VA:

   ```
   Bank: BCA
   Nomor Virtual Account: 8808 1234 5678 9012
   Jumlah: Rp 125.000

   Berlaku sampai: 10 Feb 2025 23:59
   ```

3. Buka m-BCA atau ATM BCA
4. Pilih **Transfer → BCA Virtual Account**
5. Masukkan nomor VA: **8808 1234 5678 9012**
6. Masukkan jumlah: **Rp 125.000**
7. Konfirmasi transfer
8. Simpan struk bukti transfer

**Contoh: GoPay / QRIS**

1. Pilih **"GoPay"** atau **"QRIS"**
2. Scan QR Code yang muncul
3. Konfirmasi di aplikasi GoPay
4. Pembayaran selesai

#### Step 4: Konfirmasi Otomatis

✅ **Pembayaran otomatis terverifikasi!**

- Sistem Midtrans akan callback ke server
- Status tagihan berubah jadi **"Lunas"** otomatis
- Anda mendapat notifikasi email & web

**Tidak perlu upload bukti transfer manual!**

---

## 🔔 Notifikasi

### Melihat Notifikasi:

1. Klik ikon **🔔 Notifikasi** di header
2. Lihat daftar notifikasi:

```
🔔 Notifikasi

┌──────────────────────────────────────────┐
│ 💰 Tagihan Baru Tersedia                 │
│ Tagihan Januari 2025 telah tersedia.    │
│ Total: Rp 125.000                        │
│ Jatuh tempo: 10 Februari 2025            │
│ 5 menit yang lalu                        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ✅ Pembayaran Berhasil                   │
│ Tagihan Desember 2024 telah lunas.      │
│ Total: Rp 118.500                        │
│ 1 hari yang lalu                         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ⚠️ Penggunaan Air Tinggi                 │
│ Penggunaan hari ini: 450 L               │
│ (2x lipat dari rata-rata)                │
│ Mohon cek meteran untuk kebocoran.       │
│ 2 hari yang lalu                         │
└──────────────────────────────────────────┘
```

---

## 👤 Halaman Profile

### 1. Lihat Profil

Klik menu **"Profile"** untuk melihat:

```
👤 Profil Saya

Nama: Budi Santoso
Email: budi.santoso@email.com
No. HP: 0812-3456-7890
Alamat: Jl. Merdeka No. 123, Jakarta Selatan

Status Meteran: ✅ Aktif
Nomor Meteran: MTR-00234
Kelompok Pelanggan: Rumah Tangga

[Edit Profile] [Ganti Password]
```

### 2. Edit Profil

1. Klik **"Edit Profile"**
2. Update data:
   - Nama
   - No. HP
   - Alamat
3. Klik **"Simpan"**

### 3. Ganti Password

1. Klik **"Ganti Password"**
2. Isi form:
   ```
   Password Lama: [••••••]
   Password Baru: [••••••]
   Konfirmasi Password Baru: [••••••]
   ```
3. Klik **"Update Password"**

---

## 🏠 Cara Mengajukan Pemasangan Meteran Baru

### Alur Lengkap:

```
1. Isi Data Koneksi
   ↓
2. Verifikasi Admin
   ↓
3. Bayar RAB (Rencana Anggaran Biaya)
   ↓
4. Survey Lapangan (Teknisi)
   ↓
5. Instalasi Meteran (Teknisi)
   ↓
6. Aktivasi & Pairing Meteran
   ↓
7. Mulai Monitoring 🎉
```

### Step 1: Isi Data Koneksi

1. Login ke website
2. Klik menu **"Profile"** → **"Connection Data"**
3. Klik **"Ajukan Permohonan Baru"**
4. Isi form lengkap:

```
📄 Data Koneksi Pemasangan Meteran

Data Pribadi:
• NIK: [3201234567890123]
• Upload KTP (PDF): [Browse file]
• No. KK: [3201234567890123]
• Upload KK (PDF): [Browse file]

Alamat Pemasangan:
• Alamat Lengkap: [Jl. Merdeka No. 123]
• Kelurahan: [Menteng]
• Kecamatan: [Menteng]

Data Bangunan:
• No. IMB: [IMB-123/2024]
• Upload IMB (PDF): [Browse file]
• Luas Bangunan: [120] m²

[Submit Permohonan]
```

5. Klik **"Submit Permohonan"**
6. Status: **"Menunggu Verifikasi Admin"**

### Step 2: Menunggu Verifikasi Admin

- Admin akan verifikasi data dalam **1-3 hari kerja**
- Anda akan dapat notifikasi email jika:
  - ✅ **Disetujui** → Lanjut bayar RAB
  - ❌ **Ditolak** → Perbaiki data dan submit ulang

### Step 3: Pembayaran RAB

Setelah disetujui admin:

1. Cek menu **"Profile"** → **"Connection Data"**
2. Status: **"Verified - Menunggu Pembayaran RAB"**
3. Lihat RAB (Rencana Anggaran Biaya):

```
💰 Rencana Anggaran Biaya (RAB)

Biaya Instalasi:
• Meteran IoT: Rp 500.000
• Sensor Flow: Rp 150.000
• Instalasi Pipa: Rp 200.000
• Modem 4G: Rp 300.000
• Biaya Teknisi: Rp 250.000
─────────────────────────────
TOTAL RAB: Rp 1.400.000

[Bayar RAB Sekarang]
```

4. Klik **"Bayar RAB Sekarang"**
5. Pilih metode pembayaran (sama seperti bayar tagihan)
6. Selesaikan pembayaran

### Step 4: Survey Teknisi

Setelah RAB dibayar:

- Admin akan **assign teknisi** untuk survey lokasi
- Teknisi akan **hubungi Anda** untuk jadwal survey
- Teknisi datang ke lokasi untuk:
  - Cek kondisi pipa
  - Cek ketersediaan WiFi
  - Tentukan titik instalasi meteran
- Teknisi upload hasil survey

### Step 5: Instalasi Meteran

Setelah survey:

- Teknisi **jadwalkan instalasi** (biasanya 1-3 hari setelah survey)
- Teknisi datang dengan peralatan lengkap
- Proses instalasi: **1-2 jam**
- Teknisi akan:
  - Pasang flow sensor di pipa air
  - Pasang ESP32 + relay + modem
  - Konfigurasi WiFi
  - Test koneksi ke server

### Step 6: Aktivasi & Pairing Meteran

Setelah instalasi fisik selesai:

1. Teknisi akan **aktivasi meteran** di sistem
2. Anda akan dapat **User ID** dan **Meteran ID** via email
3. Login ke website
4. Klik menu **"Profile"** → **"IoT Connection"**
5. Lihat data meteran Anda:

```
🔌 Koneksi IoT Meteran

✅ Meteran Anda Aktif!

User ID: 65a1b2c3d4e5f6g7h8i9j0k1
Meteran ID: 65k1j0i9h8g7f6e5d4c3b2a1
Nomor Meteran: MTR-00234

Status: 🟢 Online
Last Update: 2 menit yang lalu
Signal WiFi: 92%

[Test Koneksi] [View Details]
```

6. Meteran sudah siap digunakan! 🎉

### Step 7: Mulai Monitoring

- Data penggunaan air akan mulai tercatat **real-time**
- Lihat di menu **"Monitoring"** dan **"Usage"**
- Tagihan bulanan akan generate otomatis setiap tanggal 1

---

## 📊 Halaman Monitoring Real-Time

### Fitur Monitoring:

1. Klik menu **"Monitoring"**
2. Lihat data real-time:

```
📊 Monitoring Real-Time

Meteran: MTR-00234
Status: 🟢 Online
Last Update: 5 detik yang lalu

┌─────────────────────────────────────┐
│ 💧 Debit Air Saat Ini               │
│    3.5 Liter/menit                  │
│    Status: FLOWING                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📊 Penggunaan Hari Ini              │
│    245.5 Liter                      │
│    (Real-time update setiap detik)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📡 Info Koneksi                     │
│    WiFi Signal: 92% (Excellent)     │
│    Buffer: 234/2000 samples         │
│    Mode: REALTIME (1 detik)         │
└─────────────────────────────────────┘
```

### Indikator Status:

- 🟢 **Online**: Meteran terhubung & mengirim data
- 🟡 **Warning**: Signal lemah / buffer hampir penuh
- 🔴 **Offline**: Meteran tidak terhubung (> 1 jam)
- ⚫ **Error**: Meteran bermasalah

---

## 🔧 Lapor Kebocoran / Masalah

### Cara Melaporkan Masalah:

1. Klik menu **"Lapor Kebocoran"**
2. Pilih jenis masalah:
   ```
   • Meteran error / tidak jalan
   • Kebocoran pipa
   • Pembacaan tidak akurat
   • WiFi tidak terkoneksi
   • Lainnya
   ```
3. Isi detail masalah
4. Upload foto (opsional)
5. Klik **"Kirim Laporan"**

Admin akan menindaklanjuti dan assign teknisi jika perlu.

---

## ❓ FAQ (Pertanyaan Umum)

### 1. Bagaimana cara cek meteran offline?

Lihat di halaman **"Monitoring"**:

- Jika status 🔴 **Offline** → Cek WiFi router
- Jika WiFi OK tapi tetap offline → Hubungi teknisi

### 2. Mengapa tagihan saya tinggi?

Kemungkinan:

- Penggunaan air meningkat (tamu, musim kemarau)
- Ada kebocoran tersembunyi
- Meteran tidak akurat (perlu kalibrasi)

**Solusi:**

1. Lihat grafik di menu **"Usage"**
2. Matikan semua keran, cek apakah angka di **"Monitoring"** masih jalan
3. Jika masih jalan → Ada kebocoran!
4. Lapor via **"Lapor Kebocoran"**

### 3. Bagaimana jika lupa password?

1. Di halaman login, klik **"Lupa Password?"**
2. Masukkan email Anda
3. Cek email untuk link reset password
4. Klik link dan buat password baru
5. Login dengan password baru

### 4. Apakah data saya aman?

✅ Ya! AquaLink menggunakan:

- 🔒 HTTPS (SSL encryption)
- 🔐 JWT Authentication
- 🛡️ MongoDB dengan backup rutin
- 👤 Privacy policy ketat

### 5. Apakah bisa akses dari HP?

✅ Ya! Website AquaLink **responsive**:

- Bisa dibuka dari browser HP (Chrome, Safari)
- Tampilan otomatis menyesuaikan layar HP
- Semua fitur bisa diakses dari HP

### 6. Berapa biaya bulanan?

**Gratis!** Tidak ada biaya langganan.

Anda hanya bayar:

- Tagihan air (sesuai pemakaian)
- Biaya pemasangan awal (RAB) - sekali bayar

---

## 📞 Kontak & Bantuan

### Customer Service:

```
📞 Telepon: 0800-123-4567 (24 jam)
📧 Email: support@aqualink.site
💬 WhatsApp: 0812-3456-7890
🌐 Website: https://aqualink.site
```

### Jam Operasional:

```
Senin - Jumat: 08:00 - 20:00 WIB
Sabtu: 09:00 - 17:00 WIB
Minggu: 10:00 - 16:00 WIB

Emergency (kebocoran parah): 24 jam
```

### Alamat Kantor:

```
PT AquaLink Indonesia
Jl. Teknologi No. 88
Jakarta Selatan 12190
Indonesia
```

---

## 💡 Tips Menghemat Air & Biaya

### 1. Monitor Penggunaan Harian

- Cek grafik setiap hari di menu **"Usage"**
- Set target penggunaan (misal: < 200L/hari)
- Bandingkan dengan hari sebelumnya

### 2. Deteksi Kebocoran Dini

**Test Sederhana:**

```
1. Malam sebelum tidur, matikan SEMUA keran
2. Catat angka di menu "Monitoring"
3. Besok pagi (sebelum pakai air), cek lagi
4. Jika angka berubah → ADA KEBOCORAN!
```

### 3. Hemat Air di Aktivitas Harian

- 🚿 Mandi max 10 menit (hemat ~50L)
- 🚰 Matikan keran saat sikat gigi (hemat ~10L)
- 🧼 Cuci piring pakai ember, bukan air mengalir
- 🌱 Siram tanaman pagi/sore (air tidak menguap cepat)
- 💧 Tampung air hujan untuk siram tanaman

### 4. Manfaatkan Notifikasi

- Aktifkan notifikasi **"Penggunaan Tinggi"**
- Jika dapat notifikasi, langsung cek sumber (bocor/penggunaan berlebihan)

---

**Terima kasih telah menggunakan AquaLink!**

💧 _Monitoring Cerdas, Hemat Air, Hemat Biaya_

---

_Buku Pedoman Pengguna AquaLink Website v1.0_  
_Terakhir diupdate: Oktober 2025_  
_© 2025 PT AquaLink Indonesia_
