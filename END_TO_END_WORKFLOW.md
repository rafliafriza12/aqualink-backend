# 🌊 Aqualink End-to-End Workflow Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Complete Workflow Phases](#complete-workflow-phases)
4. [Phase Details with API Examples](#phase-details-with-api-examples)
5. [Midtrans Payment Integration](#midtrans-payment-integration)
6. [IoT Sensor Integration](#iot-sensor-integration)
7. [Automatic Billing System](#automatic-billing-system)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## 📌 Overview

This documentation provides a complete end-to-end flow of the Aqualink water management system, from user registration to monthly billing and payment through Midtrans payment gateway.

**Key Features:**

- User registration and authentication
- Connection data submission with PDF uploads
- Multi-level verification (Admin → Technician)
- RAB (Rencana Anggaran Biaya) creation and payment
- Water meter activation
- Real-time IoT sensor data collection
- Automatic monthly billing generation
- Payment integration with Midtrans
- Webhook for payment status updates

---

## 🏗️ System Architecture

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Registration & Login                     │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│          Connection Data Submission (with PDF)               │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│           Admin Verification (Approve/Reject)                │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│    Technician Survey Data Submission (with PDF)              │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│       Technician Verification (Approve/Reject)               │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│     RAB Connection Creation & Payment (via Midtrans)         │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│         Procedure Completion by Technician                   │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│              Water Meter Activation                          │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│         IoT Sensor Sends Water Usage Data                    │
│           (Real-time per-second data)                        │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│      Automatic Monthly Billing Generation (Cron)             │
│        (Every 1st @ 00:01 Asia/Jakarta)                      │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│        User Receives Billing Notification                    │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│     User Creates Midtrans Payment & Pays                     │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Midtrans Webhook Updates Payment Status                     │
│  → Billing marked as paid                                    │
│  → meteran.pemakaianBelumTerbayar RESET to 0                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow Phases

### Phase Timeline

| Phase | Description                | Actor             | Duration        |
| ----- | -------------------------- | ----------------- | --------------- |
| 1     | User Registration & Login  | User              | 5 minutes       |
| 2     | Connection Data Submission | User              | 15 minutes      |
| 3     | Admin Verification         | Admin             | 1-3 days        |
| 4     | Technician Survey          | Technician        | 1-2 days        |
| 5     | Technician Verification    | Technician        | 1 day           |
| 6     | RAB Creation & Payment     | Technician + User | 1-7 days        |
| 7     | Procedure Completion       | Technician        | 1-3 days        |
| 8     | Meter Activation           | Admin             | 1 day           |
| 9     | IoT Data Collection        | IoT Device        | Continuous      |
| 10    | Monthly Billing            | Cron Job          | Automatic (1st) |
| 11    | Payment via Midtrans       | User              | Instant         |

---

## 📖 Phase Details with API Examples

### Phase 1: User Registration & Login

#### 1.1 Register New User

```bash
curl -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 123, Jakarta"
  }'
```

**Response:**

```json
{
  "status": 201,
  "message": "Registrasi berhasil! Silahkan login",
  "data": {
    "user": {
      "_id": "673f1234567890abcdef1234",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "081234567890",
      "address": "Jl. Merdeka No. 123, Jakarta"
    }
  }
}
```

#### 1.2 Login User

```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

**Response:**

```json
{
  "status": 200,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "673f1234567890abcdef1234",
      "fullName": "John Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

**Save this token for subsequent requests!**

---

### Phase 2: Connection Data Submission

#### 2.1 Submit Connection Data with PDF

```bash
curl -X POST http://localhost:3000/connectionData \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -F "namaLengkap=John Doe" \
  -F "nik=3174012345678901" \
  -F "alamat=Jl. Merdeka No. 123, Jakarta" \
  -F "nomorTelepon=081234567890" \
  -F "email=john.doe@example.com" \
  -F "jenisPermohonan=Pemasangan Baru" \
  -F "tujuanPenggunaan=Rumah Tangga" \
  -F "jumlahPenghuni=5" \
  -F "luasTanah=150" \
  -F "luasBangunan=120" \
  -F "fotoKTP=@/path/to/ktp.pdf" \
  -F "fotoKK=@/path/to/kk.pdf"
```

**Response:**

```json
{
  "status": 201,
  "message": "Data koneksi berhasil dibuat",
  "data": {
    "_id": "673f5678901234abcdef5678",
    "userId": "673f1234567890abcdef1234",
    "namaLengkap": "John Doe",
    "nik": "3174012345678901",
    "status": "PENDING",
    "jenisPermohonan": "Pemasangan Baru",
    "fotoKTP": "https://cloudinary.com/...",
    "fotoKK": "https://cloudinary.com/..."
  }
}
```

**Notes:**

- Only PDF files allowed
- Maximum file size: 5MB
- Files automatically uploaded to Cloudinary
- Status initially set to "PENDING"

---

### Phase 3: Admin Verification

#### 3.1 Admin Login

```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aqualink.com",
    "password": "adminpassword"
  }'
```

#### 3.2 Admin Get All Connection Data

```bash
curl -X GET "http://localhost:3000/connectionData/admin/all?status=PENDING" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### 3.3 Admin Approve Connection Data

```bash
curl -X PUT http://localhost:3000/connectionData/673f5678901234abcdef5678/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "catatan": "Data lengkap dan valid. Silakan lanjut ke survey teknisi."
  }'
```

**Response:**

```json
{
  "status": 200,
  "message": "Status connection data berhasil diupdate",
  "data": {
    "_id": "673f5678901234abcdef5678",
    "status": "APPROVED",
    "catatan": "Data lengkap dan valid. Silakan lanjut ke survey teknisi.",
    "verifiedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Admin can also REJECT:**

```bash
curl -X PUT http://localhost:3000/connectionData/673f5678901234abcdef5678/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "catatan": "Foto KTP tidak jelas, silakan upload ulang."
  }'
```

---

### Phase 4: Technician Survey Data Submission

#### 4.1 Technician Login

```bash
curl -X POST http://localhost:3000/technician/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "technician@aqualink.com",
    "password": "techpassword"
  }'
```

#### 4.2 Technician Submit Survey Data

```bash
curl -X POST http://localhost:3000/surveyData \
  -H "Authorization: Bearer TECHNICIAN_TOKEN" \
  -F "connectionDataId=673f5678901234abcdef5678" \
  -F "kondisiLokasi=Lokasi mudah diakses, jalanan beraspal" \
  -F "jarakDariSumberAir=50" \
  -F "tekananAir=3.5" \
  -F "kualitasAir=Baik" \
  -F "aksesMobil=true" \
  -F "kendalaLapangan=Tidak ada kendala" \
  -F "estimasiBiaya=5000000" \
  -F "estimasiWaktu=7" \
  -F "rekomendasiTeknisi=Direkomendasikan untuk pemasangan" \
  -F "fotoLokasi=@/path/to/lokasi.pdf" \
  -F "fotoSumberAir=@/path/to/sumber_air.pdf"
```

**Response:**

```json
{
  "status": 201,
  "message": "Data survey berhasil dibuat",
  "data": {
    "_id": "673f9012345678abcdef9012",
    "connectionDataId": "673f5678901234abcdef5678",
    "technicianId": "673f7890123456abcdef7890",
    "kondisiLokasi": "Lokasi mudah diakses, jalanan beraspal",
    "jarakDariSumberAir": 50,
    "estimasiBiaya": 5000000,
    "estimasiWaktu": 7,
    "status": "PENDING",
    "fotoLokasi": "https://cloudinary.com/..."
  }
}
```

---

### Phase 5: Technician Verification

#### 5.1 Technician Approve Survey

```bash
curl -X PUT http://localhost:3000/surveyData/673f9012345678abcdef9012/status \
  -H "Authorization: Bearer TECHNICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "catatan": "Survey selesai, lokasi layak untuk pemasangan"
  }'
```

**This automatically creates RAB Connection!**

---

### Phase 6: RAB Connection & Payment

#### 6.1 Get RAB Connection Details

```bash
curl -X GET http://localhost:3000/rabConnection/673fab123456cdef9012 \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "_id": "673fab123456cdef9012",
    "connectionDataId": "673f5678901234abcdef5678",
    "surveyDataId": "673f9012345678abcdef9012",
    "nomorRAB": "RAB-20240115-001",
    "items": [
      {
        "nama": "Pipa PVC 1 inch",
        "kuantitas": 50,
        "satuan": "meter",
        "hargaSatuan": 25000,
        "total": 1250000
      },
      {
        "nama": "Water Meter Digital",
        "kuantitas": 1,
        "satuan": "unit",
        "hargaSatuan": 500000,
        "total": 500000
      }
    ],
    "totalBiaya": 5000000,
    "biayaMaterial": 3500000,
    "biayaTenagaKerja": 1000000,
    "biayaAdministrasi": 500000,
    "status": "PENDING_PAYMENT"
  }
}
```

#### 6.2 Create Payment for RAB (Midtrans)

```bash
curl -X POST http://localhost:3000/payment/rab/673fab123456cdef9012 \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "status": 201,
  "message": "Payment link berhasil dibuat",
  "data": {
    "orderId": "RAB-673fab123456cdef9012-1705300800000",
    "token": "66e4fa55-fdac-4ef9-91b5-733b5d859229",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/...",
    "grossAmount": 5000000
  }
}
```

**User opens `redirectUrl` in browser to complete payment**

#### 6.3 Midtrans Webhook (Automatic)

When user completes payment, Midtrans automatically sends webhook to:

```
POST http://localhost:3000/payment/webhook
```

This automatically:

- Updates RAB status to "PAID"
- Updates Transaction status
- Sends notification to user
- Allows technician to proceed with installation

---

### Phase 7: Procedure Completion

#### 7.1 Technician Complete Procedure

```bash
curl -X PUT http://localhost:3000/rabConnection/673fab123456cdef9012/procedure \
  -H "Authorization: Bearer TECHNICIAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "catatan": "Instalasi selesai, meteran air terpasang dengan baik",
    "tanggalSelesai": "2024-01-22"
  }'
```

---

### Phase 8: Water Meter Activation

#### 8.1 Admin Create Meter

```bash
curl -X POST http://localhost:3000/meteran \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "673f1234567890abcdef1234",
    "kelompokId": "673fdef123456789abcdef01",
    "nomorMeteran": "MTR-2024-001",
    "lokasi": "Jl. Merdeka No. 123, Jakarta",
    "statusAktif": true,
    "tanggalPemasangan": "2024-01-22",
    "pemakaianAwal": 0,
    "pemakaianBelumTerbayar": 0
  }'
```

**Response:**

```json
{
  "status": 201,
  "message": "Meteran berhasil dibuat",
  "data": {
    "_id": "673fgh456789abcdef123456",
    "userId": "673f1234567890abcdef1234",
    "nomorMeteran": "MTR-2024-001",
    "statusAktif": true,
    "totalPemakaian": 0,
    "pemakaianBelumTerbayar": 0,
    "jatuhTempo": "2024-02-25T00:00:00.000Z"
  }
}
```

**Meter is now ACTIVE and ready for IoT data!**

---

### Phase 9: IoT Sensor Data Collection

#### 9.1 IoT Device Sends Water Usage (Per Second)

```bash
# Example: Arduino/ESP32 sending data every second
curl -X POST http://localhost:3000/historyUsage/673f1234567890abcdef1234/673fgh456789abcdef123456 \
  -H "Content-Type: application/json" \
  -d '{
    "usedWater": 0.5
  }'
```

**Response:**

```json
{
  "status": 201,
  "message": "History usage berhasil dibuat dan total pemakaian di meteran telah diupdate",
  "data": {
    "_id": "673fij789abcdef123456789",
    "userId": "673f1234567890abcdef1234",
    "meteranId": "673fgh456789abcdef123456",
    "usedWater": 0.5,
    "createdAt": "2024-01-25T08:30:45.123Z"
  },
  "meteran": {
    "totalPemakaian": 156.5,
    "pemakaianBelumTerbayar": 156.5
  }
}
```

**Notes:**

- **NO AUTHENTICATION REQUIRED** (public endpoint for IoT device)
- Automatically updates `meteran.totalPemakaian`
- Automatically updates `meteran.pemakaianBelumTerbayar`
- Sends notification if daily usage ≥ 500 liters

#### 9.2 Arduino/ESP32 Example Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-server.com/historyUsage/USER_ID/METERAN_ID";

float waterFlowSensor = 0.5; // Liters per second from sensor

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"usedWater\":" + String(waterFlowSensor) + "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error: " + String(httpResponseCode));
    }

    http.end();
  }

  delay(1000); // Send data every 1 second
}
```

#### 9.3 User Get Water Usage History (Aggregated)

```bash
# Get daily usage for last 7 days
curl -X GET "http://localhost:3000/historyUsage/getHistory/673f1234567890abcdef1234/673fgh456789abcdef123456?filter=hari" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "status": 200,
  "message": "History usage berhasil diambil",
  "data": [
    {
      "_id": "2024-01-25",
      "totalUsage": 450.5,
      "count": 86400
    },
    {
      "_id": "2024-01-24",
      "totalUsage": 520.3,
      "count": 86400
    }
  ]
}
```

**Available filters:**

- `hari` - Daily (last 7 days)
- `minggu` - Weekly (last 4 weeks)
- `bulan` - Monthly (last 12 months)
- `tahun` - Yearly (all years)

---

### Phase 10: Automatic Monthly Billing Generation

#### 10.1 Cron Job Automatically Generates Billing

**Schedule:** Every 1st of the month at 00:01 (Asia/Jakarta)

**What happens:**

1. System calculates `totalPemakaian` for previous month
2. Gets `pemakaianAwal` from previous billing (or 0 if first billing)
3. Gets `pemakaianAkhir` from current `meteran.totalPemakaian`
4. Calculates `totalPemakaian = pemakaianAkhir - pemakaianAwal`
5. Calculates `biayaAir` using tiered pricing:
   - 0-10 m³: Rp 5,000/m³
   - > 10 m³: Rp 7,000/m³
6. Adds `biayaBeban` = Rp 20,000 (fixed)
7. Sets `dueDate` = 25th of current month
8. Updates `meteran.pemakaianBelumTerbayar += totalPemakaian`
9. Updates `meteran.jatuhTempo` = dueDate
10. Sends notification to user

#### 10.2 User Get Billing History

```bash
curl -X GET http://localhost:3000/billing/my-billing \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "status": 200,
  "message": "Billing berhasil diambil",
  "data": [
    {
      "_id": "673fkl890abcdef123456789",
      "userId": "673f1234567890abcdef1234",
      "meteranId": "673fgh456789abcdef123456",
      "periode": "2024-01",
      "pemakaianAwal": 0,
      "pemakaianAkhir": 15.5,
      "totalPemakaian": 15.5,
      "biayaAir": 88500,
      "biayaBeban": 20000,
      "totalTagihan": 108500,
      "isPaid": false,
      "dueDate": "2024-02-25T00:00:00.000Z",
      "isOverdue": false,
      "denda": 0
    }
  ]
}
```

#### 10.3 Calculation Formula

**Water Bill Calculation:**

```javascript
// For usage ≤ 10 m³
totalPemakaian = 8.5 m³
biayaAir = 8.5 × 5000 = Rp 42,500

// For usage > 10 m³
totalPemakaian = 15.5 m³
biayaAir = (10 × 5000) + (5.5 × 7000) = Rp 88,500

// Total Bill
biayaBeban = Rp 20,000
totalTagihan = biayaAir + biayaBeban = Rp 108,500
```

**Late Fee (Denda) Calculation:**

```javascript
// 2% per month (compounded)
daysLate = (today - dueDate) / (1000 * 60 * 60 * 24)
monthsLate = Math.ceil(daysLate / 30)

if (monthsLate > 0) {
  denda = totalTagihan × (0.02 × monthsLate)
}

// Example: 1 month late
denda = 108500 × (0.02 × 1) = Rp 2,170
totalPaid = 108500 + 2170 = Rp 110,670
```

---

### Phase 11: Payment via Midtrans

#### 11.1 User Get Unpaid Billing

```bash
curl -X GET http://localhost:3000/billing/unpaid \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "status": 200,
  "message": "Unpaid billing berhasil diambil",
  "data": [
    {
      "_id": "673fkl890abcdef123456789",
      "periode": "2024-01",
      "totalTagihan": 108500,
      "isPaid": false,
      "dueDate": "2024-02-25T00:00:00.000Z",
      "isOverdue": true,
      "denda": 2170,
      "totalWithDenda": 110670,
      "daysLate": 5
    }
  ]
}
```

#### 11.2 Create Midtrans Payment

```bash
curl -X POST http://localhost:3000/billing/673fkl890abcdef123456789/create-payment \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "status": 201,
  "message": "Payment link berhasil dibuat",
  "data": {
    "orderId": "BILL-673fkl890abcdef123456789-1705987200000",
    "token": "66e4fa55-fdac-4ef9-91b5-733b5d859229",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/66e4fa55-fdac-4ef9-91b5-733b5d859229",
    "billing": {
      "periode": "2024-01",
      "biayaAir": 88500,
      "biayaBeban": 20000,
      "denda": 2170,
      "totalAmount": 110670
    }
  }
}
```

**Frontend should:**

1. Open `redirectUrl` in iframe/popup
2. User completes payment on Midtrans page
3. Wait for webhook callback
4. Show success/failed message based on webhook result

#### 11.3 Midtrans Webhook (Automatic)

**Endpoint:** `POST http://localhost:3000/billing/webhook`

**Midtrans sends:**

```json
{
  "transaction_time": "2024-01-25 14:30:00",
  "transaction_status": "settlement",
  "transaction_id": "b4d0bb3b-61f5-4a7e-bca8-e4a6d5c3f7e2",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "abc123def456...",
  "payment_type": "gopay",
  "order_id": "BILL-673fkl890abcdef123456789-1705987200000",
  "merchant_id": "G141532850",
  "gross_amount": "110670.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

**What webhook does:**

1. Verify signature using SHA512 hash
2. Check `transaction_status`:
   - `capture` + `fraud_status=accept` → Payment Success
   - `settlement` → Payment Settled (Success)
   - `cancel`/`deny`/`expire` → Payment Failed
   - `pending` → Payment Pending
3. If success:
   - Update `billing.isPaid = true`
   - Update `billing.paidAt = now`
   - Update `billing.paymentMethod = "MIDTRANS"`
   - **RESET `meteran.pemakaianBelumTerbayar = 0`** ✅
   - Update `transaction.status = "success"`
   - Send notification to user
4. Return 200 OK to Midtrans

**Console output:**

```
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'settlement', ... }
✅ Payment settled: BILL-673fkl890abcdef123456789-1705987200000
```

#### 11.4 Verify Payment Status

```bash
curl -X GET http://localhost:3000/billing/673fkl890abcdef123456789 \
  -H "Authorization: Bearer USER_TOKEN"
```

**Response:**

```json
{
  "status": 200,
  "message": "Billing berhasil diambil",
  "data": {
    "_id": "673fkl890abcdef123456789",
    "periode": "2024-01",
    "totalTagihan": 110670,
    "isPaid": true,
    "paidAt": "2024-01-25T14:30:15.000Z",
    "paymentMethod": "MIDTRANS",
    "denda": 2170
  }
}
```

---

## 💳 Midtrans Payment Integration

### Payment Flow Diagram

```
User                Frontend              Backend              Midtrans
 |                     |                     |                     |
 |-- View Billing ---->|                     |                     |
 |                     |-- Get Billing ----->|                     |
 |                     |<--- Billing Data ---|                     |
 |                     |                     |                     |
 |-- Pay Button ------>|                     |                     |
 |                     |-- Create Payment -->|                     |
 |                     |                     |-- Create Txn ------>|
 |                     |                     |<-- Snap Token ------|
 |                     |<--- Snap Token -----|                     |
 |                     |                     |                     |
 |<-- Midtrans Popup --|                     |                     |
 |                     |                     |                     |
 |-- User Pays --------|------------------>  |                     |
 |                     |                     |                     |
 |                     |                     |<-- Webhook Notify --|
 |                     |                     |                     |
 |                     |                     |-- Update Billing -->|
 |                     |                     |-- Reset Meteran --->|
 |                     |                     |-- Send Notif ------>|
 |                     |                     |                     |
 |                     |                     |--- 200 OK --------->|
 |                     |                     |                     |
 |<-- Success Notif ---|<--- Webhook OK -----|                     |
```

### Signature Verification

**Important:** Midtrans webhook uses SHA512 signature for security.

**Formula:**

```javascript
const hash = crypto
  .createHash("sha512")
  .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
  .digest("hex");

if (hash !== signature_key) {
  return res.status(403).json({ message: "Invalid signature" });
}
```

### Transaction States

| Status       | Description                         | Action                      |
| ------------ | ----------------------------------- | --------------------------- |
| `pending`    | Payment initiated but not completed | Wait for user               |
| `capture`    | Payment captured (credit card)      | Verify fraud_status         |
| `settlement` | Payment settled (final success)     | Update billing, reset meter |
| `cancel`     | User cancelled payment              | Notify user                 |
| `deny`       | Payment denied by bank              | Notify user                 |
| `expire`     | Payment link expired (24 hours)     | Create new payment          |

### Webhook Testing

```bash
# Simulate webhook from Midtrans (for testing only)
curl -X POST http://localhost:3000/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_time": "2024-01-25 14:30:00",
    "transaction_status": "settlement",
    "transaction_id": "test-123",
    "status_code": "200",
    "signature_key": "GENERATED_SIGNATURE",
    "order_id": "BILL-673fkl890abcdef123456789-1705987200000",
    "gross_amount": "110670.00",
    "fraud_status": "accept"
  }'
```

**Generate signature:**

```javascript
const crypto = require("crypto");
const order_id = "BILL-673fkl890abcdef123456789-1705987200000";
const status_code = "200";
const gross_amount = "110670.00";
const serverKey = "SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-";

const signature = crypto
  .createHash("sha512")
  .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
  .digest("hex");

console.log(signature);
```

---

## 🤖 IoT Sensor Integration

### Data Collection Architecture

```
┌────────────────────────────────────────────────────┐
│           Water Flow Sensor (YF-S201)              │
│                                                     │
│  ┌──────────┐        ┌──────────┐                 │
│  │  Sensor  │───────>│ Arduino/ │                 │
│  │ YF-S201  │        │  ESP32   │                 │
│  └──────────┘        └──────────┘                 │
│                            │                       │
│                            │ WiFi                  │
│                            ▼                       │
│                    ┌──────────────┐                │
│                    │ Aqualink API │                │
│                    └──────────────┘                │
│                            │                       │
│                            ▼                       │
│                    ┌──────────────┐                │
│                    │   MongoDB    │                │
│                    │ HistoryUsage │                │
│                    └──────────────┘                │
└────────────────────────────────────────────────────┘
```

### Sensor Specifications

- **Model:** YF-S201 Water Flow Sensor
- **Output:** Pulse signal (frequency proportional to flow rate)
- **Range:** 1-30 L/min
- **Formula:** `Flow (L/min) = Frequency / 7.5`
- **Voltage:** 5V DC

### ESP32 Complete Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint
const char* userId = "673f1234567890abcdef1234";
const char* meteranId = "673fgh456789abcdef123456";
String serverUrl = "http://your-server.com/historyUsage/" + String(userId) + "/" + String(meteranId);

// Flow sensor pin
#define FLOW_SENSOR_PIN 2

// Variables
volatile int pulseCount = 0;
float flowRate = 0.0;
float totalLiters = 0.0;
unsigned long oldTime = 0;

// Interrupt function
void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.println("IP: " + WiFi.localIP().toString());

  // Setup flow sensor
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);

  oldTime = millis();
}

void loop() {
  // Calculate every 1 second
  if (millis() - oldTime >= 1000) {
    detachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN));

    // Calculate flow rate (L/min)
    flowRate = (pulseCount / 7.5);

    // Convert to L/second
    float litersPerSecond = flowRate / 60.0;
    totalLiters += litersPerSecond;

    Serial.print("Flow rate: ");
    Serial.print(flowRate);
    Serial.print(" L/min - ");
    Serial.print(litersPerSecond);
    Serial.print(" L/sec - Total: ");
    Serial.print(totalLiters);
    Serial.println(" L");

    // Send to API if there's flow
    if (litersPerSecond > 0) {
      sendToAPI(litersPerSecond);
    }

    // Reset
    pulseCount = 0;
    oldTime = millis();
    attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
  }
}

void sendToAPI(float usedWater) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"usedWater\":" + String(usedWater, 2) + "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("API Response: " + response);
    } else {
      Serial.println("Error sending data: " + String(httpResponseCode));
    }

    http.end();
  } else {
    Serial.println("WiFi disconnected");
  }
}
```

### Wiring Diagram

```
YF-S201 Sensor    ESP32
─────────────────────────
Red (VCC)    →   5V
Black (GND)  →   GND
Yellow (SIG) →   GPIO 2
```

---

## ⏰ Automatic Billing System

### Cron Jobs Schedule

| Job              | Schedule    | Time (Asia/Jakarta) | Function                       |
| ---------------- | ----------- | ------------------- | ------------------------------ |
| Monthly Billing  | `1 0 1 * *` | 00:01 on 1st        | Generate all meters billing    |
| Overdue Check    | `5 0 * * *` | 00:05 daily         | Mark overdue bills             |
| Payment Reminder | `0 8 * * *` | 08:00 daily         | Send reminders (3 days before) |

### Cron Job Console Output

```bash
# When server starts
MongoDB connected!
Billing server listening on port 3000
⏰ Cron job - Generate Monthly Billing diaktifkan (Setiap tanggal 1 pukul 00:01)
⏰ Cron job - Update Overdue Status diaktifkan (Setiap hari pukul 00:05)
⏰ Cron job - Payment Reminder diaktifkan (Setiap hari pukul 08:00)

# On 1st at 00:01
🕐 [2024-02-01 00:01:00] Running cron: Generate Monthly Billing
✅ Billing generated: 45 meters processed

# Daily at 00:05
🕐 [2024-02-15 00:05:00] Running cron: Update Overdue Status
⚠️ Marked 12 billing as overdue

# Daily at 08:00
🕐 [2024-02-22 08:00:00] Running cron: Payment Reminder
📧 Sent 8 payment reminders
```

### Manual Cron Trigger (Admin)

```bash
# Generate billing manually
curl -X POST http://localhost:3000/billing/generate-all \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update overdue status manually
curl -X PUT http://localhost:3000/billing/update-overdue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🧪 Testing Guide

### Full Flow Testing Checklist

#### ✅ Phase 1-2: Registration & Connection Data

- [ ] Register new user
- [ ] Login and get token
- [ ] Submit connection data with PDF files
- [ ] Verify files uploaded to Cloudinary
- [ ] Check status is "PENDING"

#### ✅ Phase 3: Admin Verification

- [ ] Admin login
- [ ] Get all pending connection data
- [ ] Approve connection data
- [ ] Verify notification sent to user
- [ ] Test rejection flow

#### ✅ Phase 4-5: Technician Survey

- [ ] Technician login
- [ ] Submit survey data with PDFs
- [ ] Approve survey data
- [ ] Verify RAB automatically created

#### ✅ Phase 6: RAB Payment

- [ ] Get RAB details
- [ ] Create Midtrans payment
- [ ] Complete payment on Midtrans sandbox
- [ ] Verify webhook received
- [ ] Check RAB status updated to "PAID"

#### ✅ Phase 7-8: Completion & Meter Activation

- [ ] Technician complete procedure
- [ ] Admin create water meter
- [ ] Verify meter is active

#### ✅ Phase 9: IoT Data Collection

- [ ] Send test data from Postman/cURL
- [ ] Verify `meteran.totalPemakaian` updated
- [ ] Verify `meteran.pemakaianBelumTerbayar` updated
- [ ] Get aggregated history data
- [ ] Test high usage notification (≥500L)

#### ✅ Phase 10: Billing Generation

- [ ] Wait for 1st of month OR trigger manually
- [ ] Verify billing created
- [ ] Check calculation correctness
- [ ] Verify notification sent

#### ✅ Phase 11: Payment via Midtrans

- [ ] Get unpaid billing with denda
- [ ] Create Midtrans payment
- [ ] Complete payment on Midtrans
- [ ] Verify webhook processed
- [ ] **Verify `meteran.pemakaianBelumTerbayar = 0`** ✅
- [ ] Verify notification sent

### Postman Collection

**Import this JSON to Postman:**

```json
{
  "info": {
    "name": "Aqualink End-to-End",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. User Register",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/user/register",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fullName\": \"John Doe\",\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"securepassword123\",\n  \"phone\": \"081234567890\",\n  \"address\": \"Jl. Merdeka No. 123, Jakarta\"\n}"
        }
      }
    },
    {
      "name": "2. User Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/user/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"john.doe@example.com\",\n  \"password\": \"securepassword123\"\n}"
        }
      }
    },
    {
      "name": "11. Create Midtrans Payment",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/billing/{{billingId}}/create-payment",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{userToken}}"
          }
        ]
      }
    },
    {
      "name": "12. Midtrans Webhook (Test)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/billing/webhook",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"transaction_status\": \"settlement\",\n  \"order_id\": \"BILL-XXX\",\n  \"gross_amount\": \"110670.00\",\n  \"status_code\": \"200\",\n  \"signature_key\": \"GENERATED_HASH\",\n  \"fraud_status\": \"accept\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "userToken",
      "value": ""
    },
    {
      "key": "adminToken",
      "value": ""
    },
    {
      "key": "billingId",
      "value": ""
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Webhook Not Received

**Symptoms:** Payment success but billing not updated

**Solutions:**

- Check Midtrans dashboard for webhook logs
- Ensure server is publicly accessible (use ngrok for local testing)
- Verify webhook URL in Midtrans dashboard settings
- Check console output for webhook errors
- Verify signature calculation is correct

**Ngrok setup:**

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Use the ngrok URL in Midtrans settings
https://abc123.ngrok.io/billing/webhook
```

#### 2. Meteran Not Resetting to 0

**Symptoms:** `pemakaianBelumTerbayar` still has value after payment

**Check:**

- Webhook was processed successfully (check console logs)
- Transaction status is "settlement" or "capture"
- Billing `isPaid` is true
- Meteran document is properly populated

**Verify manually:**

```bash
# Check meteran after payment
curl -X GET http://localhost:3000/meteran/USER_ID/meteran \
  -H "Authorization: Bearer USER_TOKEN"
```

#### 3. Cron Jobs Not Running

**Symptoms:** Billing not generated on 1st of month

**Check:**

- Server timezone is set to Asia/Jakarta
- Server was running at scheduled time
- Check console output for cron activation messages
- Check for error logs in cron functions

**Test manually:**

```bash
# Trigger cron manually
curl -X POST http://localhost:3000/billing/generate-all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### 4. IoT Device Connection Error

**Symptoms:** ESP32 can't send data to API

**Check:**

- WiFi connection is stable
- Server URL is correct (no trailing slash)
- userId and meteranId are correct MongoDB ObjectIDs
- Endpoint is public (no auth required)
- Check ESP32 serial monitor for error codes

**Test endpoint:**

```bash
curl -X POST http://localhost:3000/historyUsage/USER_ID/METERAN_ID \
  -H "Content-Type: application/json" \
  -d '{"usedWater": 1.5}'
```

#### 5. PDF Upload Failed

**Symptoms:** Error "File type not allowed" or "File too large"

**Check:**

- File is PDF format (not image)
- File size < 5MB
- Cloudinary credentials are correct
- Multer middleware is applied to route

#### 6. Billing Calculation Wrong

**Symptoms:** `totalTagihan` doesn't match expected value

**Check:**

- Tiered pricing calculation is correct
- `biayaBeban` is Rp 20,000
- Denda calculation uses 2% per month
- `totalPemakaian` is in m³ (not liters)

**Manual calculation:**

```javascript
// Example: 15.5 m³
const pemakaian = 15.5; // m³
const tier1 = Math.min(pemakaian, 10) * 5000; // Rp 50,000
const tier2 = Math.max(pemakaian - 10, 0) * 7000; // Rp 38,500
const biayaAir = tier1 + tier2; // Rp 88,500
const biayaBeban = 20000;
const totalTagihan = biayaAir + biayaBeban; // Rp 108,500
```

---

## 🚀 Production Deployment

### Environment Variables

```bash
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/aqualink

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Midtrans (Production)
MIDTRANS_SERVER_KEY=Mid-server-PRODUCTION-KEY
MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION-KEY
MIDTRANS_IS_PRODUCTION=true

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Midtrans Production Setup

1. Complete merchant registration on Midtrans
2. Get production credentials from Midtrans dashboard
3. Update `.env` with production keys
4. Set `MIDTRANS_IS_PRODUCTION=true`
5. Configure webhook URL in Midtrans dashboard:
   ```
   https://your-api-domain.com/billing/webhook
   ```
6. Test with real payment methods

### Deployment Checklist

- [ ] Set all environment variables
- [ ] Configure Midtrans webhook URL
- [ ] Set up domain with SSL certificate
- [ ] Enable CORS for frontend domain
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Test all cron jobs
- [ ] Test webhook with real payment
- [ ] Set up error notification (Sentry, etc.)

---

## 📞 Support

**Documentation Files:**

- `API_DOCUMENTATION_V2.md` - Complete API reference
- `BILLING_DOCUMENTATION.md` - Billing system details
- `TESTING_GUIDE_V2.md` - Testing instructions
- `END_TO_END_WORKFLOW.md` - This document

**Key Endpoints:**

- Base URL: `http://localhost:3000`
- User API: `/user/*`
- Admin API: `/admin/*`
- Billing API: `/billing/*`
- History Usage: `/historyUsage/*`
- Midtrans Webhook: `/billing/webhook`

**Contact:**

- Email: support@aqualink.com
- Documentation: https://docs.aqualink.com

---

## 📊 Summary

This end-to-end workflow covers the complete journey from user registration to monthly billing payment via Midtrans. The system integrates:

✅ **User Management** - Registration, login, authentication
✅ **Connection Process** - Data submission, multi-level verification
✅ **RAB Payment** - Midtrans integration for installation payment
✅ **Meter Activation** - Admin activation of water meters
✅ **IoT Integration** - Real-time sensor data collection
✅ **Auto Billing** - Monthly generation via cron jobs
✅ **Payment Gateway** - Midtrans Snap API with webhook
✅ **Reset Logic** - Automatic reset of `pemakaianBelumTerbayar` to 0

**Total Process Time:** ~2-3 weeks from registration to first billing
**Payment Processing:** Instant via Midtrans
**Data Collection:** Real-time (per second)
**Billing Generation:** Automatic (1st of each month)

---

_Last updated: 2024-01-25_
_Version: 2.0_
_System: Aqualink Water Management_
