# 🎛️ Buku Pedoman Administrator AquaLink

## Panduan Lengkap untuk Admin Website

---

## 🎯 Peran Administrator

Sebagai **Administrator AquaLink**, Anda bertanggung jawab untuk:

- 👥 Mengelola akun pengguna (customer)
- 📋 Verifikasi data koneksi pemasangan
- 👷 Mengelola teknisi dan assignment
- 📊 Monitoring meteran real-time
- 💰 Mengelola billing dan pembayaran
- 📈 Melihat laporan dan statistik
- ⚙️ Konfigurasi kelompok pelanggan & tarif
- 🔔 Manajemen notifikasi

---

## 🔐 Login ke Admin Panel

### Akses Admin:

```
URL: https://aqualink.site
Atau: https://api.aqualink.site/admin/auth/login
```

### Kredensial Admin:

- Diberikan oleh Super Admin atau IT Support
- Format: `admin@aqualink.site` + password

### Langkah Login:

1. Buka website AquaLink
2. Klik **"Login sebagai Admin"** (jika ada)
3. Atau akses endpoint admin langsung
4. Masukkan email admin
5. Masukkan password admin
6. Klik **"Login"**

**Token Authentication:**

- Setelah login, token admin disimpan di `localStorage.adminToken`
- Token ini digunakan untuk semua API call admin
- Token berlaku selama session (atau sesuai expiry)

### Keamanan:

⚠️ **PENTING:**

- Jangan share kredensial admin
- Logout setelah selesai
- Gunakan password kuat (min 12 karakter)
- Ganti password secara berkala

---

## 📊 Dashboard Admin

### Statistik Utama

**Endpoint:** `GET /admin/customers/stats`

```
┌──────────────────────────────────────────────────────────┐
│  🏠 Dashboard Admin - AquaLink Control Center           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Statistik Hari Ini                                   │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ 👥 Customer  │ 📡 Meteran   │ 💧 Penggunaan│        │
│  │    1,245     │     1,189    │   125,450 L  │        │
│  │    +12 baru  │   23 offline │   +2.5%      │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  💰 Revenue Bulan Ini                                    │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Total        │ Lunas        │ Pending      │        │
│  │ Rp 156.5M    │ Rp 120.3M    │ Rp 36.2M     │        │
│  │   100%       │    77%       │    23%       │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  ⚠️ Alerts (8 item perlu perhatian)                     │
│  🔴 15 meteran offline > 24 jam                         │
│  🟡 45 tagihan belum dibayar (jatuh tempo hari ini)     │
│  🟢 12 connection data baru (perlu verifikasi)           │
│  🔵 8 survey teknisi menunggu approval                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### API Call:

```javascript
// Get statistics
const response = await fetch(
  "https://api.aqualink.site/admin/customers/stats",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);

const stats = await response.json();
// {
//   totalCustomers: 1245,
//   activeMeters: 1189,
//   offlineMeters: 23,
//   totalUsageToday: 125450,
//   totalRevenue: 156500000,
//   paidRevenue: 120300000,
//   pendingRevenue: 36200000
// }
```

---

## 👥 Manajemen Customer

### 1. Melihat Daftar Customer

**Endpoint:** `GET /admin/customers`

```
Query Parameters:
- page: nomor halaman (default: 1)
- limit: jumlah per halaman (default: 10)
- search: cari berdasarkan nama/email
- hasMeteran: filter customer yang sudah punya meteran
- kelompokPelanggan: filter berdasarkan kelompok
```

**Contoh API Call:**

```javascript
const response = await fetch(
  "https://api.aqualink.site/admin/customers?page=1&limit=20&search=budi",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);

const data = await response.json();
```

### 2. Lihat Detail Customer

**Endpoint:** `GET /admin/customers/:userId`

```
Response:
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "phoneNumber": "081234567890",
  "address": "Jl. Merdeka No. 123",
  "hasMeteran": true,
  "meteranId": {
    "_id": "65k1j0i9h8g7f6e5d4c3b2a1",
    "noMeteran": "MTR-00234",
    "kelompokPelangganId": {
      "name": "Rumah Tangga",
      "hargaPenggunaanDibawah10": 2500,
      "hargaPenggunaanDiatas10": 4000
    }
  },
  "connectionData": { ... },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 3. Update Customer

**Endpoint:** `PUT /admin/customers/:userId`

```json
{
  "name": "Budi Santoso Updated",
  "phoneNumber": "081234567890",
  "address": "Jl. Baru No. 456"
}
```

### 4. Delete Customer

**Endpoint:** `DELETE /admin/customers/:userId`

⚠️ **PERHATIAN:**

- Data tidak bisa dikembalikan!
- Akan menghapus semua data terkait (meteran, billing, history)

---

## 📋 Manajemen Connection Data (Permohonan Pemasangan)

### Alur Permohonan Pemasangan:

```
1. Customer submit connection data
   ↓
2. Admin verifikasi dokumen ✓ (ANDA DI SINI)
   ↓
3. Customer bayar RAB
   ↓
4. Admin assign teknisi untuk survey
   ↓
5. Teknisi survey lokasi
   ↓
6. Teknisi instalasi meteran
   ↓
7. Admin complete procedure (aktifkan meteran)
   ↓
8. Customer mulai pakai
```

### 1. Lihat Daftar Connection Data

**Endpoint:** `GET /connection-data`

```
Query Parameters:
- isVerifiedByData: true/false (filter yang sudah/belum diverifikasi admin)
- isVerifiedByTechnician: true/false (filter yang sudah survey)
- isAllProcedureDone: true/false (filter yang sudah selesai semua)
```

**Contoh:**

```javascript
// Get connection data yang belum diverifikasi (perlu action)
const response = await fetch(
  "https://api.aqualink.site/connection-data?isVerifiedByData=false",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);

const pendingData = await response.json();
```

### 2. Lihat Detail Connection Data

**Endpoint:** `GET /connection-data/:id`

```json
{
  "_id": "65abc123def456...",
  "userId": {
    "_id": "65user123...",
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "phoneNumber": "081234567890"
  },
  "nik": "3201234567890123",
  "nikFile": "https://cloudinary.com/nik.pdf",
  "noKK": "3201234567890001",
  "kkFile": "https://cloudinary.com/kk.pdf",
  "alamat": "Jl. Merdeka No. 123, Jakarta",
  "kecamatan": "Menteng",
  "kelurahan": "Menteng",
  "noImb": "IMB/2024/001",
  "imbFile": "https://cloudinary.com/imb.pdf",
  "luasBangunan": 120,
  "isVerifiedByData": false,
  "isVerifiedByTechnician": false,
  "isAllProcedureDone": false,
  "technicianId": null,
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 3. Verifikasi Connection Data

**Endpoint:** `PUT /connection-data/:id/verify-admin`

```javascript
// Verifikasi dokumen customer
const response = await fetch(
  "https://api.aqualink.site/connection-data/65abc123/verify-admin",
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  }
);

// Response:
// {
//   "message": "Connection data verified by admin",
//   "data": { isVerifiedByData: true, ... }
// }
```

**Checklist Verifikasi:**

```
☐ NIK valid (16 digit) dan sesuai dengan KTP
☐ File KTP jelas dan terbaca
☐ No. KK valid dan sesuai dengan file KK
☐ Alamat lengkap dan sesuai KTP
☐ No. IMB valid
☐ File IMB jelas dan terbaca
☐ Luas bangunan wajar (> 20 m²)
```

**Jika ada masalah:**

- Tolak verifikasi
- Hubungi customer untuk perbaikan dokumen
- Minta customer re-submit data yang benar

### 4. Assign Teknisi untuk Survey

**Endpoint:** `PUT /connection-data/:id/assign-technician`

```json
{
  "technicianId": "65tech123abc..."
}
```

**Kapan assign teknisi?**

- Setelah connection data **diverifikasi admin** ✅
- Setelah customer **bayar RAB** ✅
- Pilih teknisi yang available dan sesuai area

**Contoh:**

```javascript
const response = await fetch(
  "https://api.aqualink.site/connection-data/65abc123/assign-technician",
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      technicianId: "65tech123abc",
    }),
  }
);
```

### 5. Unassign Teknisi (Jika Perlu)

**Endpoint:** `PUT /connection-data/:id/unassign-technician`

Gunakan jika:

- Teknisi tidak available
- Perlu ganti teknisi lain
- Teknisi sakit/cuti

### 6. Complete All Procedure

**Endpoint:** `PUT /connection-data/:id/complete-procedure`

```javascript
// Tandai proses selesai (setelah instalasi done)
const response = await fetch(
  "https://api.aqualink.site/connection-data/65abc123/complete-procedure",
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);
```

**Syarat complete:**

- ✅ Connection data verified
- ✅ RAB paid
- ✅ Survey done (teknisi verified)
- ✅ Instalasi done
- ✅ Meteran terhubung ke sistem

---

## 👷 Manajemen Teknisi

### 1. Lihat Daftar Teknisi

**Endpoint:** `GET /technician`

```json
[
  {
    "_id": "65tech123",
    "name": "Ahmad Fauzi",
    "email": "ahmad@teknisi.aqualink.site",
    "phoneNumber": "081234567890",
    "area": ["Jakarta Selatan", "Jakarta Timur"],
    "isActive": true,
    "totalJobs": 45,
    "rating": 4.8
  },
  {
    "_id": "65tech456",
    "name": "Budi Hartono",
    "email": "budi@teknisi.aqualink.site",
    "phoneNumber": "081234567891",
    "area": ["Jakarta Barat", "Tangerang"],
    "isActive": true,
    "totalJobs": 38,
    "rating": 4.6
  }
]
```

### 2. Tambah Teknisi Baru

**Endpoint:** `POST /technician`

```json
{
  "name": "Dedi Kurniawan",
  "email": "dedi@teknisi.aqualink.site",
  "password": "teknisi123",
  "phoneNumber": "081234567892",
  "area": ["Jakarta Pusat", "Jakarta Utara"],
  "spesialisasi": ["Instalasi", "Maintenance", "Troubleshooting"]
}
```

### 3. Update Teknisi

**Endpoint:** `PUT /technician/:id`

### 4. Delete Teknisi

**Endpoint:** `DELETE /technician/:id`

### 5. Lihat Job Teknisi

```javascript
// Get connection data assigned to specific technician
const response = await fetch(
  "https://api.aqualink.site/connection-data?technicianId=65tech123",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);
```

---

## 📡 Manajemen Meteran

### 1. Lihat Daftar Meteran

**Endpoint:** `GET /meteran`

```json
[
  {
    "_id": "65meter123",
    "noMeteran": "MTR-00234",
    "kelompokPelangganId": {
      "_id": "65kelompok1",
      "name": "Rumah Tangga"
    },
    "userId": {
      "_id": "65user123",
      "name": "Budi Santoso",
      "email": "budi@email.com"
    },
    "isActive": true,
    "lastSeen": "2025-01-15T14:30:00Z",
    "status": "online"
  }
]
```

### 2. Tambah Meteran Baru

**Endpoint:** `POST /meteran`

```json
{
  "noMeteran": "MTR-00235",
  "kelompokPelangganId": "65kelompok1",
  "userId": "65user456"
}
```

**Kapan buat meteran baru?**

- Setelah teknisi instalasi fisik selesai
- Customer sudah ada di sistem
- Kelompok pelanggan sudah ditentukan

### 3. Update Meteran

**Endpoint:** `PUT /meteran/:id`

```json
{
  "noMeteran": "MTR-00235-UPDATED",
  "kelompokPelangganId": "65kelompok2"
}
```

### 4. Delete Meteran

**Endpoint:** `DELETE /meteran/:id`

⚠️ Gunakan dengan hati-hati!

---

## 💰 Manajemen Billing

### 1. Generate Billing Bulanan (Semua Meteran)

**Endpoint:** `POST /billing/generate-all`

```json
{
  "periode": "2025-01"
}
```

**Cron Job Otomatis:**

```javascript
// Otomatis jalan setiap tanggal 1 pukul 00:01
// Setup di utils/billingCron.js
setupBillingCron(); // Already running on server start
```

**Manual Trigger:**

```javascript
const response = await fetch("https://api.aqualink.site/billing/generate-all", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    periode: "2025-01", // Format: YYYY-MM
  }),
});
```

### 2. Generate Billing untuk Meteran Spesifik

**Endpoint:** `POST /billing/generate-for-meter`

```json
{
  "meteranId": "65meter123",
  "periode": "2025-01",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

### 3. Lihat Semua Billing

**Endpoint:** `GET /billing/all`

```
Query Parameters:
- periode: 2025-01
- status: pending/paid/overdue
- meteranId: filter by meter
- userId: filter by user
```

### 4. Lihat Billing by ID

**Endpoint:** `GET /billing/:id`

### 5. Update Payment Status

**Endpoint:** `PUT /billing/:id/payment-status`

```json
{
  "isPaid": true,
  "paidAt": "2025-01-05T10:30:00Z",
  "paymentMethod": "midtrans",
  "transactionId": "TRX-123456"
}
```

**Catatan:**

- Untuk pembayaran Midtrans, status update **otomatis** via webhook
- Admin hanya perlu update manual jika ada masalah atau pembayaran offline

### 6. Monthly Report

**Endpoint:** `GET /billing/report/:periode`

```
GET /billing/report/2025-01

Response:
{
  "periode": "2025-01",
  "totalBilling": 1189,
  "totalAmount": 156500000,
  "paidAmount": 120300000,
  "pendingAmount": 36200000,
  "overdueAmount": 5000000,
  "paymentRate": 76.8,
  "topCustomers": [...],
  "revenueByKelompok": [...]
}
```

### 7. Delete Billing

**Endpoint:** `DELETE /billing/:id`

⚠️ Gunakan hanya untuk koreksi atau testing!

---

## 📊 Monitoring Real-Time

### 1. Get History Usage (Admin)

**Endpoint:** `GET /history/all`

```
Query Parameters:
- userId: filter by user
- meteranId: filter by meter
- startDate: 2025-01-01
- endDate: 2025-01-31
- periode: daily/weekly/monthly
```

**Contoh:**

```javascript
// Get usage data for specific meter
const response = await fetch(
  "https://api.aqualink.site/history/all?meteranId=65meter123&startDate=2025-01-01&endDate=2025-01-31",
  {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
);

const historyData = await response.json();
// [
//   { date: '2025-01-01', totalUsedWater: 245.5, ... },
//   { date: '2025-01-02', totalUsedWater: 230.2, ... },
//   ...
// ]
```

### 2. Monitor Meteran Offline

```javascript
// Get all meters
const meters = await fetch("https://api.aqualink.site/meteran", {
  headers: { Authorization: `Bearer ${adminToken}` },
}).then((r) => r.json());

// Filter offline meters (lastSeen > 1 hour ago)
const now = new Date();
const offlineMeters = meters.filter((m) => {
  const lastSeen = new Date(m.lastSeen);
  const hoursDiff = (now - lastSeen) / 1000 / 60 / 60;
  return hoursDiff > 1;
});

console.log(`Offline meters: ${offlineMeters.length}`);
```

---

## 💳 Manajemen RAB (Rencana Anggaran Biaya)

### 1. Lihat Daftar RAB

**Endpoint:** `GET /rab-connection`

```
Query Parameters:
- isPaid: true/false
- userId: filter by user
```

### 2. Tambah RAB Baru

**Endpoint:** `POST /rab-connection`

```json
{
  "userId": "65user123",
  "connectionDataId": "65conn123",
  "items": [
    {
      "name": "Meteran IoT",
      "quantity": 1,
      "price": 500000
    },
    {
      "name": "Sensor Flow YF-S201",
      "quantity": 1,
      "price": 150000
    },
    {
      "name": "Instalasi Pipa",
      "quantity": 1,
      "price": 200000
    },
    {
      "name": "Modem 4G",
      "quantity": 1,
      "price": 300000
    },
    {
      "name": "Biaya Teknisi",
      "quantity": 1,
      "price": 250000
    }
  ],
  "totalAmount": 1400000,
  "notes": "Instalasi standar untuk rumah 2 lantai"
}
```

### 3. Update RAB

**Endpoint:** `PUT /rab-connection/:id`

### 4. Delete RAB

**Endpoint:** `DELETE /rab-connection/:id`

---

## ⚙️ Kelompok Pelanggan & Tarif

### 1. Lihat Kelompok Pelanggan

**Endpoint:** `GET /kelompok-pelanggan`

```json
[
  {
    "_id": "65kelompok1",
    "name": "Rumah Tangga",
    "biayaBeban": 10000,
    "hargaPenggunaanDibawah10": 2500,
    "hargaPenggunaanDiatas10": 4000,
    "description": "Tarif untuk pelanggan rumah tangga"
  },
  {
    "_id": "65kelompok2",
    "name": "Bisnis",
    "biayaBeban": 25000,
    "hargaPenggunaanDibawah10": 5000,
    "hargaPenggunaanDiatas10": 6000,
    "description": "Tarif untuk pelanggan bisnis/komersial"
  }
]
```

### 2. Tambah Kelompok Baru

**Endpoint:** `POST /kelompok-pelanggan`

```json
{
  "name": "Industri",
  "biayaBeban": 50000,
  "hargaPenggunaanDibawah10": 7500,
  "hargaPenggunaanDiatas10": 8000,
  "description": "Tarif untuk pelanggan industri"
}
```

### 3. Update Tarif

**Endpoint:** `PUT /kelompok-pelanggan/:id`

```json
{
  "hargaPenggunaanDibawah10": 3000,
  "hargaPenggunaanDiatas10": 4500
}
```

**Catatan:**

- Perubahan tarif berlaku untuk billing periode berikutnya
- Tidak retroaktif (billing lama tetap pakai tarif lama)

### 4. Delete Kelompok

**Endpoint:** `DELETE /kelompok-pelanggan/:id`

⚠️ Tidak bisa delete jika masih ada meteran yang pakai kelompok ini!

---

## 🔔 Notifikasi

### 1. Send Notification to User

**Endpoint:** `POST /notification`

```json
{
  "userId": "65user123",
  "title": "Tagihan Baru Tersedia",
  "message": "Tagihan bulan Januari 2025 telah tersedia. Total: Rp 125.000",
  "type": "billing",
  "link": "/billing"
}
```

### 2. Broadcast Notification

```javascript
// Get all users
const users = await fetch("https://api.aqualink.site/admin/customers", {
  headers: { Authorization: `Bearer ${adminToken}` },
}).then((r) => r.json());

// Send notification to all users
for (const user of users.data) {
  await fetch("https://api.aqualink.site/notification", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user._id,
      title: "Maintenance Terjadwal",
      message: "Maintenance server pada 15 Feb 2025, 02:00-05:00 WIB",
      type: "system",
    }),
  });
}
```

---

## 📈 Laporan & Analitik

### 1. Customer Statistics

**Endpoint:** `GET /admin/customers/stats`

```json
{
  "totalCustomers": 1245,
  "newCustomersThisMonth": 12,
  "activeMeters": 1189,
  "offlineMeters": 23,
  "totalUsageToday": 125450,
  "totalUsageThisMonth": 3500000,
  "avgUsagePerCustomer": 2811.2
}
```

### 2. Revenue Statistics

```javascript
// Get all billing for current month
const periode = "2025-01";
const billings = await fetch(
  `https://api.aqualink.site/billing/report/${periode}`,
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  }
).then((r) => r.json());

console.log("Total Revenue:", billings.totalAmount);
console.log("Paid:", billings.paidAmount);
console.log("Pending:", billings.pendingAmount);
console.log("Payment Rate:", billings.paymentRate + "%");
```

### 3. Top Customers by Usage

```javascript
// Get history usage for all users
const history = await fetch(
  "https://api.aqualink.site/history/all?periode=monthly",
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  }
).then((r) => r.json());

// Sort by usage
const sorted = history.sort((a, b) => b.totalUsedWater - a.totalUsedWater);
const top10 = sorted.slice(0, 10);
```

---

## 🛠️ Troubleshooting Admin

### Problem 1: Meteran Banyak Offline

**Diagnosis:**

```javascript
// Check server status
const response = await fetch("https://api.aqualink.site/");
// Should return: "hallo"

// Check database connection
// (logged di server console)

// Get offline meters
const offlineMeters = await fetch(
  "https://api.aqualink.site/meteran?status=offline",
  {
    headers: { Authorization: `Bearer ${adminToken}` },
  }
).then((r) => r.json());
```

**Solusi:**

- Jika 1-2 meteran: Masalah WiFi customer → Assign teknisi
- Jika banyak meteran: Masalah server/network → Hubungi IT

### Problem 2: Billing Tidak Generate Otomatis

**Diagnosis:**

```bash
# Check cron job di server
# Lihat server logs untuk error
```

**Solusi:**

```javascript
// Manual trigger generate billing
const response = await fetch("https://api.aqualink.site/billing/generate-all", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    periode: "2025-01",
  }),
});
```

### Problem 3: Pembayaran Midtrans Tidak Tercatat

**Diagnosis:**

```javascript
// Check webhook logs
// Endpoint: POST /webhook/midtrans
```

**Solusi:**

- Verifikasi webhook URL di Midtrans dashboard
- Check server logs untuk error
- Manual update payment status jika perlu

---

## 📞 Support & Kontak

### IT Support:

```
📧 Email: it-support@aqualink.site
📞 Phone: 0800-IT-HELP (0800-48-4357)
💬 Slack: #admin-support
```

### API Documentation:

```
📖 Docs: /home/whoami/aqualink/aqualink-backend/API_DOCUMENTATION_V2.md
🌐 Swagger: https://api.aqualink.site/api-docs (jika ada)
```

### Emergency Contacts:

```
🚨 Server Down: 0811-9999-8888
🔒 Security Issue: security@aqualink.site
💾 Database Issue: dba@aqualink.site
```

---

## 🎓 Best Practices Admin

### Daily Tasks:

```
☐ Cek dashboard untuk anomali
☐ Review connection data baru (perlu verifikasi)
☐ Monitor meteran offline (> 1 jam)
☐ Verifikasi pembayaran Midtrans (auto, tapi cek)
☐ Respond to customer support tickets
```

### Weekly Tasks:

```
☐ Review billing payment rate
☐ Evaluate teknisi performance
☐ Check server logs untuk error
☐ Generate weekly report untuk management
```

### Monthly Tasks:

```
☐ Verify billing generate (tanggal 1)
☐ Review tarif pelanggan
☐ Teknisi performance review
☐ Database backup verification
☐ Security audit
```

---

## 🔐 Keamanan Admin

### Password Policy:

```
✓ Minimal 12 karakter
✓ Kombinasi huruf besar, kecil, angka, simbol
✓ Ganti password setiap 3 bulan
✗ Jangan share kredensial
✗ Jangan simpan password di plain text
```

### Session Management:

```
✓ Logout setelah selesai
✓ Gunakan incognito untuk akses publik
✓ Clear cache berkala
✓ Jangan save password di browser
```

### Data Protection:

```
✓ Jangan download data customer tanpa izin
✓ Jangan share data ke pihak ketiga
✓ Backup data sensitif dengan encryption
✓ Follow GDPR/data protection policy
```

---

**Selamat Mengelola AquaLink!**

🎛️ _Admin Panel - Kontrol Penuh, Tanggung Jawab Besar_

---

_Buku Pedoman Administrator AquaLink Website v1.0_  
_Terakhir diupdate: Oktober 2025_  
_© 2025 PT AquaLink Indonesia_
