# 🔧 Buku Pedoman Teknisi AquaLink

## Panduan Lengkap untuk Tim Teknis Lapangan

---

## 🎯 Peran Teknisi

Sebagai **Teknisi AquaLink**, Anda bertanggung jawab untuk:

- 🔍 **Survey lokasi** pemasangan meteran
- 🔌 **Instalasi hardware** meteran IoT
- 🔧 **Konfigurasi sistem** dan koneksi WiFi
- 📊 **Testing** dan kalibrasi sensor
- 🛠️ **Maintenance** meteran existing
- 🚨 **Troubleshooting** masalah lapangan
- 📝 **Dokumentasi** pekerjaan (foto, data survey)
- 💬 **Komunikasi** dengan customer & admin

---

## 🌐 Akses Sistem Teknisi

### Login ke Website

**URL:** `https://aqualink.site` atau endpoint khusus teknisi

### Kredensial Teknisi:

- Email: `nama@teknisi.aqualink.site`
- Password: Diberikan oleh Admin saat registrasi

### Login Process:

1. Buka browser (Chrome/Firefox recommended)
2. Akses website AquaLink
3. Login dengan kredensial teknisi
4. Token disimpan di `localStorage.technicianToken`

**API Authentication:**

```javascript
// Setiap API call harus include token
const response = await fetch("https://api.aqualink.site/endpoint", {
  headers: {
    Authorization: `Bearer ${technicianToken}`,
  },
});
```

---

## 📋 Dashboard Teknisi

### Lihat Job yang Di-assign

**Endpoint:** `GET /connection-data?technicianId=YOUR_ID`

```
┌─────────────────────────────────────────────────┐
│  👷 Dashboard Teknisi - Ahmad Fauzi             │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Status Hari Ini:                            │
│  Job Assigned: 3                                │
│  Job Completed: 1                               │
│  Job In Progress: 1                             │
│  Job Pending: 1                                 │
│                                                 │
│  ⭐ Rating: 4.8/5.0 (142 reviews)               │
│  🏆 Total Jobs Completed: 387                   │
│                                                 │
│  🚨 Job Priority Tinggi (1):                    │
│  ┌───────────────────────────────────────────┐ │
│  │ CONN-00234 - Survey Lokasi                │ │
│  │ 📍 Jl. Merdeka 123, Jakarta Selatan       │ │
│  │ 👤 Budi Santoso (0812-3456-7890)          │ │
│  │ ⏰ Deadline: Besok, 15:00                  │ │
│  │ [Lihat Detail] [Mulai Job]                │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🏠 ALUR KERJA LENGKAP

### Alur Pekerjaan Teknisi:

```
1. Admin assign job ke teknisi
   ↓
2. Teknisi lihat job di dashboard
   ↓
3. Teknisi hubungi customer untuk jadwal
   ↓
4. Teknisi survey lokasi ← FASE 1
   ↓
5. Teknisi upload data survey
   ↓
6. Teknisi instalasi meteran ← FASE 2
   ↓
7. Teknisi test & aktivasi
   ↓
8. Serah terima ke customer
   ↓
9. Complete job ✅
```

---

## 🔍 FASE 1: SURVEY LOKASI

### Step 1: Terima Assignment

```javascript
// Get jobs assigned to you
const jobs = await fetch("https://api.aqualink.site/connection-data", {
  headers: {
    Authorization: `Bearer ${technicianToken}`,
  },
}).then((r) => r.json());

// Filter by your technician ID (atau sudah di-filter server)
const myJobs = jobs.filter(
  (j) => j.technicianId === YOUR_ID && !j.isVerifiedByTechnician
);
```

### Step 2: Hubungi Customer

**Data customer dari API:**

```json
{
  "userId": {
    "name": "Budi Santoso",
    "phoneNumber": "081234567890",
    "email": "budi@email.com"
  },
  "alamat": "Jl. Merdeka No. 123, Jakarta Selatan",
  "kecamatan": "Menteng",
  "kelurahan": "Menteng"
}
```

**Telepon customer:**

```
"Selamat pagi/siang, Pak/Bu [Nama].
Saya [Nama Teknisi] dari AquaLink.
Bapak/Ibu sudah mengajukan pemasangan meteran air.
Saya akan survey lokasi dulu.
Kapan waktu yang tepat? Besok jam 10 pagi bisa?"
```

### Step 3: Persiapan Survey

**Checklist Peralatan Survey:**

```
☐ Meteran pita (untuk ukur jarak/pipa)
☐ Multimeter (test listrik)
☐ WiFi analyzer app (cek signal)
☐ Kamera/HP (dokumentasi)
☐ Clipboard + form survey (backup manual)
☐ Business card AquaLink
☐ Identitas teknisi (ID card)
```

### Step 4: Survey Lapangan

**Checklist Survey:**

#### A. Kondisi Pipa

```
☐ Diameter pipa air PDAM: [0.5 / 0.75 / 1 inch]
☐ Material pipa: [PVC / Besi / Tembaga]
☐ Kondisi pipa: [Baik / Rusak / Berkarat]
☐ Posisi pipa dari tanah: [Di atas tanah / Tertanam]
☐ Jarak dari meteran PDAM ke rumah: [___] meter
```

#### B. Sumber Listrik

```
☐ Ada stopkontak dalam radius 5 meter? [Ya / Tidak]
☐ Voltage listrik: [220V AC] (ukur dengan multimeter)
☐ Ada grounding? [Ya / Tidak]
☐ Posisi stopkontak aman dari air? [Ya / Tidak]
```

#### C. Koneksi Internet

```
☐ Ada WiFi di rumah? [Ya / Tidak]
☐ WiFi SSID: [____________]
☐ Signal strength: [Excellent / Good / Fair / Poor]
☐ Gunakan WiFi analyzer app untuk ukur signal
☐ Jarak dari router ke posisi meteran: [___] meter
```

#### D. Lokasi Instalasi

```
☐ Tentukan titik instalasi flow sensor (di pipa)
☐ Tentukan titik box meteran IoT (ESP32, relay, modem)
☐ Foto lokasi instalasi dari berbagai sudut
☐ Ukur koordinat GPS (lat, long)
```

#### E. Data Bangunan

```
☐ Jumlah penghuni: [___] orang
☐ Jumlah lantai: [___]
☐ Jumlah kamar mandi: [___]
☐ Jenis bangunan: [Rumah / Ruko / Apartemen]
☐ Apakah standar instalasi? [Ya / Tidak]
   (Standar = pipa lurus, stopkontak tersedia, WiFi bagus)
```

### Step 5: Foto Dokumentasi

**Upload foto:**

```
📷 Foto 1: Posisi meteran PDAM
📷 Foto 2: Posisi rencana instalasi flow sensor
📷 Foto 3: Diagram jaringan pipa (sketsa)
📷 Foto 4: Posisi stopkontak listrik
📷 Foto 5: Posisi box meteran IoT
📷 Foto 6: Foto lokasi keseluruhan
```

### Step 6: Upload Data Survey

**Endpoint:** `POST /survey-data`

**Content-Type:** `multipart/form-data`

```javascript
const formData = new FormData();
formData.append("connectionDataId", connectionDataId);
formData.append("jaringanFile", jaringanPDF); // Diagram jaringan (PDF)
formData.append("diameterPipa", 0.75); // inch
formData.append("posisiBakFile", posisiBakPDF); // Foto posisi bak (PDF)
formData.append("posisiMeteranFile", posisiMeteranPDF); // Foto posisi meteran (PDF)
formData.append("jumlahPenghuni", 5);
formData.append("koordinatLat", -6.914744);
formData.append("koordinatLong", 107.60981);
formData.append("standar", true); // true/false

const response = await fetch("https://api.aqualink.site/survey-data", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${technicianToken}`,
  },
  body: formData,
});
```

**File Format:**

- Semua file harus **PDF**
- Maksimal **5MB per file**
- Bisa convert foto JPG ke PDF dulu

### Step 7: Verifikasi Survey

**Endpoint:** `PUT /connection-data/:id/verify-technician`

```javascript
// Setelah upload survey data
const response = await fetch(
  `https://api.aqualink.site/connection-data/${connectionDataId}/verify-technician`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${technicianToken}`,
    },
  }
);

// Response:
// {
//   "message": "Connection data verified by technician",
//   "data": { isVerifiedByTechnician: true, ... }
// }
```

**Status setelah verifikasi:**

- `isVerifiedByTechnician: true` ✅
- Admin bisa lihat hasil survey
- Menunggu jadwal instalasi (biasanya 1-3 hari setelah survey)

---

## 🔌 FASE 2: INSTALASI METERAN

### Peralatan yang Diperlukan

#### Hardware Utama:

```
☐ ESP32 Dev Board (1 unit)
☐ Flow sensor YF-S201 (1 unit)
☐ Relay module 5V 1 channel (1 unit)
☐ OLED display SSD1306 128x64 I2C (1 unit)
☐ Modem USB 4G/LTE (1 unit)
☐ Power adapter 5V/2A (1 unit)
```

#### Komponen Pendukung:

```
☐ Kabel jumper female-female (15 pcs)
☐ Kabel USB micro (untuk ESP32)
☐ Breadboard (untuk testing sementara)
☐ Box waterproof untuk ESP32 + relay
☐ Teflon tape (seal ulir pipa)
☐ Cable ties (pengikat kabel)
☐ Isolasi listrik
```

#### Tools:

```
☐ Tang potong & kupas kabel
☐ Obeng set (+) dan (-)
☐ Kunci inggris (untuk pipa)
☐ Multimeter digital
☐ Solder + timah (jika perlu)
☐ Laptop (untuk flash firmware & config WiFi)
```

#### Sparepart Cadangan:

```
☐ Flow sensor YF-S201 (backup)
☐ Relay module (backup)
☐ Jumper wire extra
☐ Fuse 1A
```

---

### Step 1: Pre-Installation Check

```
☐ Konfirmasi jadwal dengan customer (H-1)
☐ Pastikan semua peralatan lengkap
☐ Charge laptop full battery
☐ Download firmware terbaru (v4.3-FINAL)
☐ Review data survey sebelumnya
☐ Siapkan WiFi credentials customer
```

### Step 2: Wiring Hardware

#### Diagram Koneksi:

```
┌─────────────────────────────────────────────────────────┐
│         AQUALINK IOT v4.3 - WIRING DIAGRAM              │
└─────────────────────────────────────────────────────────┘

            ┌──────────────────┐
            │    ESP32 Dev     │
            │    Board         │
            └──────────────────┘
                 │  │  │  │
        ┌────────┘  │  │  └────────┐
        │           │  │           │
  ┌─────▼─────┐ ┌──▼──▼──┐ ┌──────▼──────┐
  │  YF-S201  │ │  OLED   │ │   RELAY     │
  │   Flow    │ │ Display │ │   MODULE    │
  │  Sensor   │ │SSD1306  │ │   5V 1CH    │
  └───────────┘ └─────────┘ └─────────────┘
       │                          │
    ┌──▼──┐                  ┌────▼────┐
    │PIPA │                  │ MODEM   │
    │ AIR │                  │ USB 4G  │
    └─────┘                  └─────────┘


DETAIL PIN CONNECTION:

ESP32 ← Flow Sensor YF-S201:
├─ GPIO 34 ← SIGNAL (kuning)
├─ 3.3V → VCC (merah)
└─ GND → GND (hitam)

ESP32 ← OLED Display SSD1306 (I2C):
├─ GPIO 22 ← SCL (clock)
├─ GPIO 21 ← SDA (data)
├─ 3.3V → VCC
└─ GND → GND

ESP32 → Relay Module:
├─ GPIO 23 → IN (control)
├─ VIN (5V) → VCC
└─ GND → GND

Relay → Modem:
├─ COM ← Power 5V
├─ NO → Modem VCC
└─ Modem GND → Common GND

Power Supply:
├─ 5V → ESP32 VIN
└─ GND → ESP32 GND (common ground untuk semua)

⚠️ CRITICAL NOTES:
1. Flow sensor HARUS 3.3V (BUKAN 5V!)
2. Modem HARUS melalui relay (untuk power saving)
3. Common GND untuk SEMUA komponen
4. Relay control via GPIO 23 (LOW=OFF, HIGH=ON)
```

#### Step-by-Step Wiring:

**1. Hubungkan Flow Sensor ke Pipa**

```
1. Matikan kran utama (stop aliran air)
2. Pasang flow sensor YF-S201:

   [PIPA PDAM] → [YF-S201] → [PIPA RUMAH]

   • Perhatikan arah panah di sensor (inlet → outlet)
   • Gunakan teflon tape 3-4 lapis di ulir
   • Kencangkan dengan kunci inggris (jangan terlalu keras)
   • Test kebocoran (buka kran sedikit)

3. Sambungkan kabel sensor:
   • Kuning (SIGNAL) → ESP32 GPIO 34
   • Merah (VCC) → ESP32 3.3V ⚠️
   • Hitam (GND) → ESP32 GND
```

**2. Hubungkan OLED Display**

```
OLED ke ESP32:
• VCC → ESP32 3.3V
• GND → ESP32 GND
• SCL → ESP32 GPIO 22
• SDA → ESP32 GPIO 21

Posisi display:
• Pasang di dinding dengan double tape
• Atau masukkan ke box transparan (mudah dilihat)
```

**3. Hubungkan Relay Module**

```
Relay ke ESP32:
• VCC → ESP32 VIN (5V)
• GND → ESP32 GND
• IN → ESP32 GPIO 23

Relay ke Modem:
• COM ← Power Supply 5V
• NO → Modem VCC (USB power)
• Modem GND → Common GND

Fungsi:
• GPIO 23 HIGH → Relay ON → Modem ON (kirim data)
• GPIO 23 LOW → Relay OFF → Modem OFF (hemat daya)
```

**4. Hubungkan Power Supply**

```
Power Adapter 5V/2A ke ESP32:
• (+) 5V → ESP32 VIN
• (-) GND → ESP32 GND

Colok ke stopkontak PLN:
• Pastikan ada MCB/sekering 1A
• Gunakan stabilizer jika voltage tidak stabil
```

**5. Test Wiring**

```
1. Nyalakan power
2. Cek LED ESP32 menyala (merah/biru)
3. Cek OLED display muncul text:

   ┌─────────────────┐
   │  AquaLink v4.3  │
   │  INITIALIZING.. │
   │  ───────────    │
   │  WiFi: Searching│
   └─────────────────┘

4. Ukur voltage dengan multimeter:
   • ESP32 VIN: ~5V ✓
   • ESP32 3.3V: ~3.3V ✓
   • Flow sensor VCC: ~3.3V ✓

5. Test relay:
   • Relay LED mati (OFF) saat idle ✓
   • Relay "KLIK" dan LED nyala saat transmit
```

---

### Step 3: Flash Firmware

**File firmware:** `AquaLink_IoT_Simple.ino` (v4.3-FINAL)

**Menggunakan Arduino IDE:**

```
1. Hubungkan ESP32 ke laptop via USB

2. Buka Arduino IDE
   • File → Open → AquaLink_IoT_Simple.ino

3. Pilih Board:
   • Tools → Board → ESP32 Dev Module

4. Pilih Port:
   • Tools → Port → COM3 (atau sesuai device)

5. Set Flash Settings:
   • Upload Speed: 115200
   • Flash Frequency: 80MHz
   • Flash Mode: QIO

6. Compile & Upload:
   • Klik tombol Upload (→)
   • Tunggu sampai "Done uploading"

7. Verifikasi:
   • Buka Serial Monitor (Ctrl+Shift+M)
   • Baud Rate: 115200
   • Lihat output:

   [SETUP] AquaLink IoT v4.3 - REALTIME MODE
   [SETUP] Initializing...
   [SETUP] Flow sensor ready on GPIO 34
   [SETUP] OLED display ready
   [SETUP] Relay control ready on GPIO 23
   [SETUP] System ready!
```

---

### Step 4: Konfigurasi WiFi

**Via Serial Monitor:**

```
1. Buka Serial Monitor di Arduino IDE
2. Baud Rate: 115200
3. Sistem akan minta WiFi credentials:

   [WiFi] No credentials found
   [WiFi] Enter WiFi SSID:

4. Ketik SSID WiFi customer, tekan Enter
5. Sistem minta password:

   [WiFi] Enter WiFi Password:

6. Ketik password, tekan Enter
7. ESP32 akan connect:

   [WiFi] Connecting to [SSID]...
   [WiFi] .................... Connected!
   [WiFi] IP Address: 192.168.1.105
   [WiFi] Signal: -45 dBm (Excellent)
   [WiFi] MAC: AA:BB:CC:DD:EE:FF

8. WiFi credentials tersimpan di EEPROM
```

**Alternatif: WiFi Manager (Jika Firmware Support)**

```
1. ESP32 otomatis buat WiFi AP:
   SSID: AquaLink-CONFIG-XXXXX
   Password: aqualink2025

2. Hubungkan HP/laptop ke WiFi tersebut

3. Buka browser, auto redirect ke:
   http://192.168.4.1

4. Pilih WiFi customer dari list
5. Masukkan password
6. Klik "Save & Connect"
7. ESP32 restart dan connect ke WiFi customer
```

---

### Step 5: Registrasi Meteran ke Server

**Menggunakan Web Admin (Recommended):**

1. **Admin sudah buat meteran di sistem:**

   ```
   POST /meteran
   {
     "noMeteran": "MTR-00234",
     "kelompokPelangganId": "65kelompok1",
     "userId": "65user123"
   }
   ```

2. **Update user dengan meteranId:**

   ```
   Admin akan link meteran ke user
   User sekarang punya meteranId di profil
   ```

3. **Customer dapat User ID dan Meteran ID via email**

4. **Teknisi verifikasi meteran online:**
   ```
   Lihat di admin panel atau Monitoring page:
   Status: 🟢 Online
   Last Update: 5 detik yang lalu
   ```

---

### Step 6: Testing & Kalibrasi

#### Test 1: Flow Detection

```
1. Buka keran air (small flow ~1 L/min)
2. Lihat OLED display:

   ┌─────────────────┐
   │  AquaLink v4.3  │
   │  REALTIME MODE  │
   │  ───────────    │
   │  Buf: 3/2000    │
   │  Flow: 1.2 L/min│
   │  Status: FLOWING│
   └─────────────────┘

3. Tutup keran
4. Display berubah:

   ┌─────────────────┐
   │  Flow: 0.0 L/min│
   │  Status: IDLE   │
   └─────────────────┘

✅ PASS jika angka berubah sesuai flow
❌ FAIL → cek wiring flow sensor
```

#### Test 2: Relay Power Saving

```
1. Perhatikan relay:

   [Normal Mode]
   Relay LED OFF → Modem OFF (hemat daya)

   [Setiap 60 menit]
   Relay LED ON → "KLIK" → Modem ON
   Kirim data ke server (5-10 detik)
   Relay LED OFF → "KLIK" → Modem OFF

2. Cek di web monitoring:
   Last Update: 5 detik yang lalu ✅

✅ PASS jika relay hanya ON saat transmit
❌ FAIL → cek GPIO 23 atau kode
```

#### Test 3: Skip Zero Recording

```
1. Keran tertutup 5 menit (flow = 0)
2. Buka keran, alirkan air
3. Tutup keran lagi
4. Cek di web admin History Usage:

   10:05 - 0.5 L ✓ (dicatat)
   10:06 - 1.2 L ✓
   10:07 - 1.5 L ✓
   10:08 - 0.0 L ✗ (SKIP, tidak dicatat)
   10:09 - 0.0 L ✗ (SKIP)

✅ PASS jika nilai 0L tidak ada di database
❌ FAIL → cek threshold di code (0.001L)
```

#### Test 4: API Connection

```
1. Buka web admin
2. Menu: Monitoring atau Admin/Customers
3. Cari meteran: MTR-00234
4. Cek status:

   Status: 🟢 Online
   Last Update: 2 menit lalu
   Buffer: 45/2000 (2.3%)
   Signal: 92%

✅ PASS jika Online & data masuk
❌ FAIL → cek WiFi atau server
```

#### Test 5: Akurasi Pengukuran

```
1. Siapkan ember 10 liter (ukuran pasti)
2. Catat angka awal di monitoring web
3. Isi ember sampai PENUH (tepat 10.0 L)
4. Catat angka akhir
5. Hitung selisih:

   Awal: 1234.0 L
   Akhir: 1244.0 L
   Selisih: 10.0 L

   Error = |10.0 - 10.0| / 10.0 × 100% = 0%

✅ PASS jika error < 2%
⚠️ WARNING jika error 2-5%
❌ FAIL jika error > 5% → perlu kalibrasi
```

#### Kalibrasi (Jika Error > 5%):

```
1. Edit firmware, cari variabel:
   float calibrationFactor = 4.5; // Default YF-S201

2. Hitung calibration factor baru:
   New CF = Old CF × (Measured / Actual)

   Contoh:
   Measured = 10.5 L (dari meteran)
   Actual = 10.0 L (dari ember)
   Old CF = 4.5

   New CF = 4.5 × (10.5 / 10.0) = 4.725

3. Update di code:
   float calibrationFactor = 4.725;

4. Upload ulang firmware
5. Test lagi sampai error < 2%
```

---

### Step 7: Serah Terima Customer

**Penjelasan ke Customer:**

```
"Pak/Bu, instalasi sudah selesai.

Yang Bapak/Ibu perlu tahu:

1. Display Meteran (tunjukkan):
   • Flow: Kecepatan air saat ini (Liter/menit)
   • Status FLOWING: Air sedang mengalir
   • Status IDLE: Tidak ada aliran

2. Website (demo di laptop/HP):
   • Buka: https://aqualink.site
   • Login dengan email Bapak/Ibu
   • Lihat di menu "Monitoring" untuk real-time
   • Menu "Usage" untuk grafik harian
   • Menu "Billing" untuk tagihan

3. Tagihan:
   • Setiap tanggal 1 ada tagihan baru
   • Bayar via Midtrans (e-wallet/bank)
   • Jatuh tempo tanggal 10

4. Jika Ada Masalah:
   • Meteran offline → Cek WiFi
   • Angka tidak jalan → Hubungi hotline
   • Kebocoran → Lapor via web

5. Kontak Support:
   • Hotline: 0800-123-4567 (24 jam)
   • WhatsApp: 0812-3456-7890
   • Email: support@aqualink.site

Apakah ada pertanyaan, Pak/Bu?"
```

**Minta Feedback (Optional):**

```
"Mohon bantu isi rating untuk service kami, Pak/Bu.
Nanti akan ada notifikasi di website."
```

---

### Step 8: Complete Job

**Via Web Teknisi Panel (atau API):**

**Endpoint:** `PUT /connection-data/:id/complete-procedure`

```javascript
// Ini biasanya dilakukan oleh Admin
// Tapi teknisi bisa report completion
const response = await fetch(
  `https://api.aqualink.site/connection-data/${connectionDataId}/complete-procedure`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`, // Admin token
    },
  }
);
```

**Atau Report via sistem:**

- Upload foto hasil instalasi
- Update status job ke "Completed"
- Admin akan review dan mark as complete

---

## 🛠️ TROUBLESHOOTING LAPANGAN

### Problem 1: Flow Sensor Tidak Detect

**Gejala:**

```
Display: Flow: 0.0 L/min (walaupun air mengalir)
```

**Diagnosis:**

```
1. Cek wiring:
   • Signal (kuning) ke GPIO 34? ✓
   • VCC (merah) ke 3.3V (BUKAN 5V)? ✓
   • GND ke GND? ✓

2. Cek sensor fisik:
   • Impeller berputar saat air mengalir?
   • Arah panah sensor benar?

3. Test sensor:
   • Buka Serial Monitor
   • Lihat output: "Flow: XXX Hz"
   • Jika Hz = 0 → sensor rusak atau wiring salah
```

**Solusi:**

```
1. Re-check wiring (paling sering masalah di sini)
2. Ganti sensor jika rusak
3. Pastikan flow > 0.5 L/min (sensor punya threshold minimum)
```

---

### Problem 2: WiFi Tidak Connect

**Gejala:**

```
Display: WiFi: Connecting...
(stuck di connecting)
```

**Diagnosis:**

```
1. Cek WiFi customer:
   • Router menyala?
   • HP bisa connect ke WiFi ini?

2. Cek signal:
   • Gunakan WiFi analyzer app
   • Signal > 50% = OK
   • Signal < 30% = terlalu lemah

3. Cek credentials:
   • SSID benar? (case-sensitive)
   • Password benar? (case-sensitive)
```

**Solusi:**

```
1. Re-enter WiFi credentials via Serial Monitor
2. Pindahkan ESP32 lebih dekat ke router (sementara)
3. Saran customer:
   • Gunakan WiFi extender
   • Pindahkan router lebih dekat
   • Upgrade router jika signal lemah
```

---

### Problem 3: Relay Tidak Berfungsi

**Gejala:**

```
Relay selalu ON (LED selalu nyala) atau selalu OFF
```

**Diagnosis:**

```
1. Test relay manual:
   • Lepas pin IN dari ESP32
   • Hubungkan IN ke 5V → Relay harus ON (LED nyala, "KLIK")
   • Hubungkan IN ke GND → Relay harus OFF (LED mati)

2. Jika relay tidak respond:
   → Relay rusak

3. Jika relay OK tapi code tidak berfungsi:
   → Cek GPIO 23 atau kode firmware
```

**Solusi:**

```
1. Ganti relay jika rusak
2. Cek wiring:
   • VCC → VIN (5V)
   • GND → GND
   • IN → GPIO 23
3. Re-upload firmware jika perlu
```

---

### Problem 4: Data Tidak Masuk ke Server

**Gejala:**

```
Meteran online di website, tapi data usage tidak update
```

**Diagnosis:**

```
1. Cek koneksi:
   • WiFi connected? ✓
   • Internet working? (ping google.com)

2. Cek server:
   • Buka https://api.aqualink.site/ → harus return "hallo"
   • Jika error → server down (hubungi admin)

3. Cek buffer:
   • Display: Buf: 1950/2000 (hampir penuh?)
   • Jika penuh terus → data tidak terkirim

4. Cek API response:
   • Lihat Serial Monitor saat transmit
   • Status: 200 OK → berhasil
   • Status: 401/403 → masalah authentication
   • Status: 500 → server error
```

**Solusi:**

```
1. Restart ESP32 (tekan tombol RST)
2. Check User ID dan Meteran ID di server (admin)
3. Re-flash firmware jika API endpoint berubah
4. Hubungi admin untuk cek server logs
```

---

## 📝 Dokumentasi Wajib

### Foto yang Harus Diambil:

```
1. 📷 Foto meteran keseluruhan (wide shot)
2. 📷 Foto flow sensor di pipa (close-up)
3. 📷 Foto OLED display menyala (show status)
4. 📷 Foto wiring ESP32 (untuk referensi)
5. 📷 Foto box meteran IoT (dengan cover)
6. 📷 Foto relay & modem
7. 📷 Foto power supply & stopkontak
8. 📷 Foto lokasi instalasi (konteks keseluruhan)
```

### Data yang Harus Dicatat:

```
• Meteran ID: MTR-00234
• User ID: 65user123
• WiFi SSID: WiFi_Customer
• Signal Strength: 92%
• Calibration Factor: 4.5 (atau yang sudah disesuaikan)
• Test Result: ✅ All pass
• Waktu Instalasi: 2 jam
• Catatan Khusus: [Jika ada]
```

---

## 📞 Support Teknisi

### Hotline Teknisi:

```
📞 Teknisi Support: 0800-TECH-77 (0800-8324-77)
📧 Email: tech-support@aqualink.site
💬 WhatsApp: 0821-1234-5678
```

### Koordinator Lapangan:

```
Jakarta: Pak Agus (0821-1111-2222)
Bandung: Pak Dedi (0822-3333-4444)
Surabaya: Pak Eko (0823-5555-6666)
```

### Gudang Sparepart:

```
📦 Gudang: 0811-9999-8888
📍 Jl. Teknologi No. 88, Jakarta Selatan
⏰ Senin-Sabtu: 08:00-17:00
```

---

## 🎓 Best Practices Teknisi

### Do's ✅

```
☑ Selalu konfirmasi jadwal H-1 dengan customer
☑ Datang tepat waktu (max 15 menit telat)
☑ Gunakan seragam dan ID card
☑ Bawa semua peralatan (termasuk backup)
☑ Test SEMUA fungsi sebelum serah terima
☑ Explain dengan bahasa sederhana ke customer
☑ Dokumentasi lengkap (foto + data)
☑ Rapikan kabel dan area kerja
☑ Upload hasil kerja ke sistem
☑ Follow up H+1 untuk cek meteran masih OK
```

### Don'ts ❌

```
☒ Jangan skip testing (walaupun buru-buru)
☒ Jangan hubungkan 5V ke pin 3.3V (merusak sensor!)
☒ Jangan asal wiring (harus sesuai diagram)
☒ Jangan tinggalkan tools di lokasi customer
☒ Jangan lupa matikan kran saat bongkar pipa
☒ Jangan kasih janji yang tidak pasti
☒ Jangan abaikan keluhan customer
☒ Jangan lupa upload dokumentasi
☒ Jangan cabut kabel saat power ON
☒ Jangan skip kalibrasi akurasi
```

---

## 💰 Insentif Teknisi

### Target Bulanan:

```
Basic: 20 instalasi/bulan
Target: 30 instalasi/bulan
Excellent: 40+ instalasi/bulan

Bonus:
🥉 20-29 job: Rp 500,000
🥈 30-39 job: Rp 1,000,000
🥇 40+ job: Rp 2,000,000 + Gadget Bonus
```

### Rating Bonus:

```
Rating ≥ 4.8 → +Rp 300,000
Rating ≥ 4.5 → +Rp 150,000
Rating < 4.0 → Warning + Re-training
```

---

**Selamat Bekerja, Teknisi AquaLink!**

🔧 _Hands That Build, Mind That Solves_

---

_Buku Pedoman Teknisi AquaLink Website v1.0_  
_Terakhir diupdate: Oktober 2025_  
_© 2025 PT AquaLink Indonesia_
