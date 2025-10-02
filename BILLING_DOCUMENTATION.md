# Billing System Documentation

## Overview

Sistem Billing Otomatis untuk tagihan air bulanan PDAM. Sistem ini secara otomatis generate tagihan setiap tanggal 1 setiap bulan, mengirim pengingat jatuh tempo, dan mengelola denda keterlambatan.

---

## 🏗️ Model Billing

### Schema

```javascript
{
  userId: ObjectId(Users),
  meteranId: ObjectId(Meteran),
  periode: String,              // Format: YYYY-MM
  pemakaianAwal: Number,        // m³ awal bulan
  pemakaianAkhir: Number,       // m³ akhir bulan
  totalPemakaian: Number,       // m³
  biayaAir: Number,             // Rupiah (berdasarkan tarif)
  biayaBeban: Number,           // Rupiah (biaya tetap)
  totalTagihan: Number,         // Rupiah (total + denda jika ada)
  isPaid: Boolean,              // Status pembayaran
  paidAt: Date,                 // Tanggal pembayaran
  paymentMethod: String,        // "MANUAL", "TRANSFER", "EWALLET"
  dueDate: Date,                // Jatuh tempo (tanggal 25 bulan depan)
  isOverdue: Boolean,           // Status keterlambatan
  denda: Number,                // Rupiah (denda keterlambatan)
  notes: String,                // Catatan tambahan
  createdAt: Date,              // Auto timestamp
  updatedAt: Date               // Auto timestamp
}
```

---

## 🤖 Automatic Billing System (Cron Jobs)

### 1. Monthly Billing Generation

**Schedule**: Setiap tanggal 1 jam 00:01 (1 0 1 \* \*)

**Proses**:

1. Get semua meteran aktif
2. Cek apakah billing bulan ini sudah ada
3. Ambil `pemakaianAkhir` dari billing bulan lalu sebagai `pemakaianAwal`
4. Hitung `totalPemakaian` = `meteran.totalPemakaian` - `pemakaianAwal`
5. Hitung biaya berdasarkan `KelompokPelanggan`:
   - 0-10 m³: `hargaPenggunaanDibawah10`
   - > 10 m³: `hargaPenggunaanDiatas10`
   - Tambah `biayaBeban`
6. Buat record Billing
7. Update `meteran.pemakaianBelumTerbayar += totalPemakaian`
8. Kirim notifikasi "Tagihan Air Baru"

**Log Output**:

```
🕐 Running monthly billing generation...
✅ Success: Billing created for MTR-001 - Rp135.000
✅ Success: Billing created for MTR-002 - Rp245.000
⏭️  Skipped: Billing already exists for MTR-003
❌ Failed: MTR-004 - Negative usage
✅ Monthly billing generation completed: 2 success, 1 failed
```

### 2. Overdue Status Check

**Schedule**: Setiap hari jam 00:05 (5 0 \* \* \*)

**Proses**:

1. Cari semua billing `isPaid=false` dan `dueDate < today`
2. Update `isOverdue = true`
3. Kirim notifikasi "Tagihan Terlambat"

**Log Output**:

```
🕐 Running overdue billing check...
⚠️  Overdue: Billing 60d5ec49... for periode 2024-01
⚠️  Overdue: Billing 60d5ec50... for periode 2024-01
✅ Overdue check completed: 2 billing marked as overdue
```

### 3. Payment Reminder

**Schedule**: Setiap hari jam 08:00 (0 8 \* \* \*)

**Proses**:

1. Cari billing belum bayar dengan jatuh tempo 3 hari lagi
2. Cek apakah reminder hari ini sudah dikirim
3. Kirim notifikasi "Pengingat Jatuh Tempo"

**Log Output**:

```
🕐 Running billing reminder check...
📨 Reminder sent to John Doe - 3 days until due
📨 Reminder sent to Jane Smith - 2 days until due
✅ Reminder check completed: 2 reminders sent
```

---

## 📡 API Endpoints

### 1. Generate Monthly Billing (Admin) - Manual Trigger

**POST** `/billing/generate-all`

Generate billing untuk semua meteran aktif.

**Auth**: Admin Token

**Body** (Optional):

```json
{
  "periode": "2024-01" // Default: current month
}
```

**Response**:

```json
{
  "status": 201,
  "message": "Generate billing selesai",
  "data": {
    "periode": "2024-01",
    "summary": {
      "total": 150,
      "success": 145,
      "failed": 2,
      "skipped": 3
    },
    "details": {
      "success": [...],
      "failed": [...],
      "skipped": [...]
    }
  }
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:5000/billing/generate-all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"periode": "2024-01"}'
```

---

### 2. Generate Billing for Single Meter (Admin)

**POST** `/billing/generate/:meteranId`

Generate billing untuk satu meteran spesifik.

**Auth**: Admin Token

**Body** (Optional):

```json
{
  "periode": "2024-01"
}
```

**Response**:

```json
{
  "status": 201,
  "message": "Billing berhasil dibuat",
  "data": {
    "billing": {
      "_id": "...",
      "userId": "...",
      "meteranId": "...",
      "periode": "2024-01",
      "totalPemakaian": 25,
      "biayaAir": 125000,
      "biayaBeban": 10000,
      "totalTagihan": 135000,
      "dueDate": "2024-02-25"
    },
    "notification": {...}
  }
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:5000/billing/generate/60d5ec49f1b2c72b8c8e4f1b \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 3. Get All Billing (Admin)

**GET** `/billing/all`

**Auth**: Admin Token

**Query Params**:

- `isPaid` (boolean) - Filter by payment status
- `periode` (string) - Filter by period (YYYY-MM)
- `userId` (string) - Filter by user ID
- `meteranId` (string) - Filter by meteran ID
- `isOverdue` (boolean) - Filter by overdue status

**cURL Example**:

```bash
# Get unpaid billing
curl -X GET "http://localhost:5000/billing/all?isPaid=false" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get billing for specific periode
curl -X GET "http://localhost:5000/billing/all?periode=2024-01" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get overdue billing
curl -X GET "http://localhost:5000/billing/all?isOverdue=true&isPaid=false" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 4. Get My Billing (User)

**GET** `/billing/my-billing`

Get semua billing user yang login.

**Auth**: User Token

**Response**:

```json
{
  "status": 200,
  "count": 12,
  "data": [
    {
      "_id": "...",
      "periode": "2024-01",
      "totalPemakaian": 25,
      "totalTagihan": 135000,
      "isPaid": true,
      "paidAt": "2024-01-20T10:30:00Z",
      "dueDate": "2024-02-25"
    },
    ...
  ]
}
```

**cURL Example**:

```bash
curl -X GET http://localhost:5000/billing/my-billing \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

### 5. Get Unpaid Billing (User)

**GET** `/billing/unpaid`

Get semua tagihan belum bayar dengan kalkulasi denda.

**Auth**: User Token

**Response**:

```json
{
  "status": 200,
  "data": {
    "bills": [
      {
        "_id": "...",
        "periode": "2024-01",
        "totalPemakaian": 25,
        "totalTagihan": 135000,
        "daysLate": 5,
        "denda": 2700,
        "totalWithDenda": 137700,
        "dueDate": "2024-02-25",
        "isPaid": false
      }
    ],
    "totalUnpaid": 137700,
    "count": 1
  }
}
```

**Denda Calculation**:

- **2% per bulan** dari total tagihan
- Dihitung berdasarkan jumlah hari keterlambatan
- Formula: `denda = (totalTagihan * 0.02) * ceil(daysLate / 30)`

**cURL Example**:

```bash
curl -X GET http://localhost:5000/billing/unpaid \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

### 6. Pay Billing (User) ⭐

**PUT** `/billing/:id/pay`

Bayar tagihan. **PENTING: Ketika user bayar, `meteran.pemakaianBelumTerbayar` akan direset menjadi 0**.

**Auth**: User Token

**Body**:

```json
{
  "paymentMethod": "TRANSFER" // Optional: "MANUAL", "TRANSFER", "EWALLET"
}
```

**Process**:

1. Validasi billing exists dan belongs to user
2. Hitung denda jika overdue
3. Update `billing.isPaid = true`
4. **Reset `meteran.pemakaianBelumTerbayar = 0`** ← KEY FEATURE
5. Kirim notifikasi pembayaran sukses

**Response**:

```json
{
  "status": 200,
  "message": "Pembayaran berhasil",
  "data": {
    "billing": {
      "_id": "...",
      "isPaid": true,
      "paidAt": "2024-01-20T10:30:00Z",
      "paymentMethod": "TRANSFER",
      "denda": 2700,
      "totalTagihan": 137700
    },
    "notification": {...},
    "summary": {
      "periode": "2024-01",
      "biayaAir": 125000,
      "biayaBeban": 10000,
      "denda": 2700,
      "totalPaid": 137700
    }
  }
}
```

**cURL Example**:

```bash
curl -X PUT http://localhost:5000/billing/60d5ec49f1b2c72b8c8e4f1a/pay \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "TRANSFER"}'
```

---

### 7. Update Payment Status (Admin)

**PUT** `/billing/:id/payment-status`

Admin update status pembayaran manual.

**Auth**: Admin Token

**Body**:

```json
{
  "isPaid": true,
  "paymentMethod": "MANUAL",
  "notes": "Pembayaran cash di kantor"
}
```

**Process**:

- Jika `isPaid=true`: Reset `meteran.pemakaianBelumTerbayar = 0`
- Jika `isPaid=false`: Restore `meteran.pemakaianBelumTerbayar`

**cURL Example**:

```bash
curl -X PUT http://localhost:5000/billing/60d5ec49f1b2c72b8c8e4f1a/payment-status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPaid": true,
    "paymentMethod": "MANUAL",
    "notes": "Pembayaran cash"
  }'
```

---

### 8. Update Overdue Status (Admin/Cron)

**PUT** `/billing/update-overdue`

Manual trigger untuk cek dan update status overdue.

**Auth**: Admin Token

**cURL Example**:

```bash
curl -X PUT http://localhost:5000/billing/update-overdue \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 9. Get Monthly Report (Admin)

**GET** `/billing/report/:periode`

Laporan bulanan lengkap dengan summary.

**Auth**: Admin Token

**Response**:

```json
{
  "status": 200,
  "data": {
    "periode": "2024-01",
    "summary": {
      "totalPelanggan": 150,
      "totalPemakaian": 3750,
      "totalTagihan": 18750000,
      "totalPaid": 15000000,
      "totalUnpaid": 3750000,
      "totalDenda": 75000,
      "pelangganBayar": 120,
      "pelangganBelumBayar": 30
    },
    "details": [...]
  }
}
```

**cURL Example**:

```bash
curl -X GET http://localhost:5000/billing/report/2024-01 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 10. Delete Billing (Admin)

**DELETE** `/billing/:id`

Hapus billing. Jika billing belum dibayar, restore `meteran.pemakaianBelumTerbayar`.

**Auth**: Admin Token

**cURL Example**:

```bash
curl -X DELETE http://localhost:5000/billing/60d5ec49f1b2c72b8c8e4f1a \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 💰 Billing Calculation Logic

### Tarif Air (Berdasarkan KelompokPelanggan)

```javascript
if (totalPemakaian <= 10) {
  biayaAir = totalPemakaian * hargaPenggunaanDibawah10;
} else {
  biayaAir =
    10 * hargaPenggunaanDibawah10 +
    (totalPemakaian - 10) * hargaPenggunaanDiatas10;
}

totalTagihan = biayaAir + biayaBeban;
```

**Example**:

- KelompokPelanggan: Rumah Tangga

  - hargaPenggunaanDibawah10: Rp 3.000/m³
  - hargaPenggunaanDiatas10: Rp 5.000/m³
  - biayaBeban: Rp 10.000

- Pemakaian: 25 m³
  - 10 m³ pertama: 10 × Rp 3.000 = Rp 30.000
  - 15 m³ sisanya: 15 × Rp 5.000 = Rp 75.000
  - Biaya air: Rp 105.000
  - Biaya beban: Rp 10.000
  - **Total: Rp 115.000**

### Denda Keterlambatan

```javascript
// 2% per bulan keterlambatan
dendaPerMonth = totalTagihan * 0.02;
monthsLate = Math.ceil(daysLate / 30);
denda = dendaPerMonth * monthsLate;
```

**Example**:

- Total tagihan: Rp 115.000
- Terlambat 35 hari (2 bulan)
- Denda per bulan: Rp 115.000 × 2% = Rp 2.300
- Total denda: Rp 2.300 × 2 = **Rp 4.600**
- **Total bayar: Rp 119.600**

---

## 🔄 Meteran Field Update Logic

### pemakaianBelumTerbayar

Field ini tracking total pemakaian yang belum dibayar (akumulasi).

**Saat Generate Billing**:

```javascript
meteran.pemakaianBelumTerbayar += billing.totalPemakaian;
// Contoh: 0 + 25 = 25 m³
```

**Saat User Bayar**: ⭐

```javascript
meteran.pemakaianBelumTerbayar = 0; // RESET KE 0
```

**Scenario Example**:

| Event                | totalPemakaian | pemakaianBelumTerbayar |
| -------------------- | -------------- | ---------------------- |
| Initial              | -              | 0 m³                   |
| Generate billing Jan | 25 m³          | 25 m³                  |
| Generate billing Feb | 30 m³          | 55 m³                  |
| **User bayar Jan**   | -              | **0 m³** (RESET)       |
| Generate billing Mar | 28 m³          | 28 m³                  |
| **User bayar semua** | -              | **0 m³** (RESET)       |

---

## 📅 Timeline & Schedule

### Monthly Billing Cycle

```
Tanggal 1    → Generate billing otomatis (Cron)
Tanggal 22   → Kirim reminder 3 hari sebelum jatuh tempo
Tanggal 23   → Kirim reminder 2 hari sebelum jatuh tempo
Tanggal 24   → Kirim reminder 1 hari sebelum jatuh tempo
Tanggal 25   → Jatuh tempo pembayaran
Tanggal 26+  → Status overdue, mulai hitung denda
```

### Cron Schedule Summary

| Cron Job           | Schedule    | Time              | Description                               |
| ------------------ | ----------- | ----------------- | ----------------------------------------- |
| Billing Generation | `1 0 1 * *` | 00:01 tanggal 1   | Generate billing bulanan                  |
| Overdue Check      | `5 0 * * *` | 00:05 setiap hari | Cek dan update status overdue             |
| Payment Reminder   | `0 8 * * *` | 08:00 setiap hari | Kirim reminder 3 hari sebelum jatuh tempo |

---

## 🔔 Notification System

### 1. Tagihan Air Baru

**Trigger**: Saat billing dibuat (tanggal 1 atau manual)

```
Title: "Tagihan Air Baru"
Message: "Tagihan air untuk periode 2024-01 sebesar Rp135.000.
          Total pemakaian: 25 m³. Jatuh tempo: 25 Februari 2024"
Category: "TRANSAKSI"
```

### 2. Pengingat Jatuh Tempo

**Trigger**: 3 hari sebelum jatuh tempo (08:00)

```
Title: "Pengingat Jatuh Tempo"
Message: "Tagihan air periode 2024-01 sebesar Rp135.000 akan jatuh tempo
          dalam 3 hari (25 Februari 2024). Segera lakukan pembayaran."
Category: "INFORMASI"
```

### 3. Tagihan Terlambat

**Trigger**: Setelah jatuh tempo (00:05)

```
Title: "Tagihan Terlambat"
Message: "Tagihan air periode 2024-01 sebesar Rp135.000 telah melewati
          jatuh tempo. Segera lakukan pembayaran untuk menghindari denda."
Category: "PERINGATAN"
```

### 4. Pembayaran Berhasil

**Trigger**: Saat user bayar tagihan

```
Title: "Pembayaran Berhasil"
Message: "Pembayaran tagihan air periode 2024-01 sebesar Rp137.700
          (termasuk denda keterlambatan Rp2.700) telah berhasil"
Category: "TRANSAKSI"
```

---

## 🧪 Testing Guide

### 1. Test Manual Billing Generation

```bash
# Generate billing untuk semua meteran
curl -X POST http://localhost:5000/billing/generate-all \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Generate untuk satu meteran
curl -X POST http://localhost:5000/billing/generate/METERAN_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 2. Test User Get Unpaid Bills

```bash
curl -X GET http://localhost:5000/billing/unpaid \
  -H "Authorization: Bearer USER_TOKEN"
```

Expected: List tagihan belum bayar dengan kalkulasi denda

### 3. Test User Pay Bill

```bash
curl -X PUT http://localhost:5000/billing/BILLING_ID/pay \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "TRANSFER"}'
```

Expected:

- Response sukses
- `meteran.pemakaianBelumTerbayar` = 0
- Notifikasi pembayaran berhasil

### 4. Test Overdue Check

```bash
curl -X PUT http://localhost:5000/billing/update-overdue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Expected: Billing overdue di-update statusnya

### 5. Test Monthly Report

```bash
curl -X GET http://localhost:5000/billing/report/2024-01 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Expected: Summary dan detail billing periode tersebut

---

## 🚀 Deployment Checklist

### Environment Variables

Ensure these are set in `.env`:

```
MONGO_URI=mongodb://...
PORT=5000
JWT_SECRET=...
```

### Cron Job Verification

After deployment, check logs:

```
✅ Billing cron job scheduled: 1st day of every month at 00:01
✅ Overdue cron job scheduled: Daily at 00:05
✅ Reminder cron job scheduled: Daily at 08:00
✅ All cron jobs are active
```

### Monitor Cron Execution

Check server logs for cron job output:

```
🕐 Running monthly billing generation...
✅ Monthly billing generation completed: 145 success, 2 failed
```

---

## � Midtrans Payment Integration

### Overview

Sistem billing terintegrasi dengan **Midtrans Payment Gateway** untuk pembayaran tagihan air secara online. User dapat membayar menggunakan berbagai metode pembayaran (GoPay, OVO, Bank Transfer, Credit Card, dll).

### Payment Flow

```
User → Create Payment → Midtrans Snap → User Pays → Webhook → Update Billing → Reset Meteran
```

### API Endpoints

#### 1. Create Midtrans Payment (User)

**Endpoint**: `POST /billing/:id/create-payment`

**Headers**:

```
Authorization: Bearer USER_TOKEN
```

**Response**:

```json
{
  "status": 201,
  "message": "Payment link berhasil dibuat",
  "data": {
    "orderId": "BILL-673fkl890abcdef123456789-1705987200000",
    "token": "66e4fa55-fdac-4ef9-91b5-733b5d859229",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
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

**Frontend Implementation**:

```javascript
// Open Midtrans Snap popup
snap.pay(data.token, {
  onSuccess: function (result) {
    console.log("Payment success", result);
    // Webhook will handle the rest
  },
  onPending: function (result) {
    console.log("Payment pending", result);
  },
  onError: function (result) {
    console.log("Payment error", result);
  },
  onClose: function () {
    console.log("Payment popup closed");
  },
});
```

#### 2. Midtrans Webhook Handler

**Endpoint**: `POST /billing/webhook`

**No Authentication Required** (called by Midtrans)

**Webhook Payload from Midtrans**:

```json
{
  "transaction_time": "2024-01-25 14:30:00",
  "transaction_status": "settlement",
  "transaction_id": "b4d0bb3b-61f5-4a7e-bca8-e4a6d5c3f7e2",
  "status_code": "200",
  "signature_key": "abc123def456...",
  "payment_type": "gopay",
  "order_id": "BILL-673fkl890abcdef123456789-1705987200000",
  "gross_amount": "110670.00",
  "fraud_status": "accept"
}
```

**What Webhook Does**:

1. Verify signature using SHA512 hash
2. Find Transaction and Billing by `order_id`
3. Handle transaction status:
   - `settlement` or `capture` + `fraud_status=accept`: Payment Success
     - Update `billing.isPaid = true`
     - Update `billing.paidAt = now`
     - Update `billing.paymentMethod = "MIDTRANS"`
     - **RESET `meteran.pemakaianBelumTerbayar = 0`** ✅
     - Update `transaction.status = "success"`
     - Send notification to user
   - `pending`: Update transaction status only
   - `cancel`/`deny`/`expire`: Mark as failed, send notification
4. Return 200 OK to Midtrans

**Signature Verification**:

```javascript
const crypto = require("crypto");
const serverKey = process.env.MIDTRANS_SERVER_KEY;

const hash = crypto
  .createHash("sha512")
  .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
  .digest("hex");

if (hash !== signature_key) {
  return res.status(403).json({ message: "Invalid signature" });
}
```

### Transaction Model

Used to track Midtrans payment transactions:

```javascript
{
  userId: ObjectId(Users),
  billingId: ObjectId(Billing),
  orderId: String,              // Unique order ID
  grossAmount: Number,          // Total amount
  status: String,               // "pending", "success", "failed"
  snapToken: String,            // Midtrans snap token
  snapRedirectUrl: String,      // Payment URL
  paymentType: String,          // "gopay", "bank_transfer", etc.
  transactionId: String,        // Midtrans transaction ID
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Method Support

Midtrans Snap supports:

- 🏦 Bank Transfer (BCA, Mandiri, BNI, Permata, BRI)
- 💳 Credit/Debit Card (Visa, MasterCard, JCB)
- 🛒 E-Wallet (GoPay, ShopeePay, QRIS)
- 🏪 Convenience Store (Indomaret, Alfamart)
- 📱 Direct Debit (BCA KlikPay, CIMB Clicks)

### Testing with Sandbox

**Sandbox Credentials** (already configured):

- Server Key: `SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-`
- Client Key: `SB-Mid-client-63GqcLJxWhrc5D0A`

**Test Credit Card**:

```
Card Number: 4811 1111 1111 1114
CVV: 123
Exp: 01/25
3D Secure OTP: 112233
```

**Test GoPay**:

- Use GoPay Simulator in sandbox
- OTP: 112233

**Test Bank Transfer**:

- Use virtual account number provided
- Use Midtrans simulator to mark as paid

### Webhook Testing

#### Local Testing with ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# In another terminal, start ngrok
ngrok http 3000

# Copy the HTTPS URL
https://abc123.ngrok.io
```

#### Configure Webhook in Midtrans Dashboard

1. Login to Midtrans dashboard
2. Go to Settings → Configuration
3. Set webhook URL:
   ```
   https://abc123.ngrok.io/billing/webhook
   ```
4. Test payment to trigger webhook

#### Manual Webhook Testing

```bash
# Generate signature
node -e "
const crypto = require('crypto');
const order_id = 'BILL-673fkl890abcdef123456789-1705987200000';
const status_code = '200';
const gross_amount = '110670.00';
const serverKey = 'SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-';
const signature = crypto.createHash('sha512').update(order_id+status_code+gross_amount+serverKey).digest('hex');
console.log(signature);
"

# Send test webhook
curl -X POST http://localhost:3000/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_time": "2024-01-25 14:30:00",
    "transaction_status": "settlement",
    "transaction_id": "test-123",
    "status_code": "200",
    "signature_key": "PASTE_GENERATED_SIGNATURE_HERE",
    "order_id": "BILL-673fkl890abcdef123456789-1705987200000",
    "gross_amount": "110670.00",
    "fraud_status": "accept"
  }'
```

### Console Output Examples

**When Payment Created**:

```
📝 Creating Midtrans payment for billing: 673fkl890abcdef123456789
💰 Total amount: Rp 110,670 (including denda)
✅ Payment link created: BILL-673fkl890abcdef123456789-1705987200000
```

**When Webhook Received**:

```
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'settlement', ... }
🔒 Signature verified
✅ Payment settled: BILL-673fkl890abcdef123456789-1705987200000
📝 Billing updated: isPaid=true
🔄 Meteran reset: pemakaianBelumTerbayar=0
📧 Notification sent to user
```

**When Payment Failed**:

```
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'cancel', ... }
❌ Payment failed: BILL-673fkl890abcdef123456789-1705987200000
📧 Notification sent to user
```

### Production Setup

#### Environment Variables

```bash
# Midtrans Production
MIDTRANS_SERVER_KEY=Mid-server-YOUR-PRODUCTION-KEY
MIDTRANS_CLIENT_KEY=Mid-client-YOUR-PRODUCTION-KEY
MIDTRANS_IS_PRODUCTION=true

# Frontend URL (for payment redirect)
FRONTEND_URL=https://your-frontend-domain.com
```

#### Midtrans Dashboard Configuration

1. Complete merchant registration
2. Get production credentials
3. Configure webhook URL:
   ```
   https://your-api-domain.com/billing/webhook
   ```
4. Set payment methods (enable/disable)
5. Configure 3D Secure settings
6. Set transaction limits
7. Enable email notifications

#### Security Checklist

- ✅ Use HTTPS for webhook URL
- ✅ Verify signature on every webhook call
- ✅ Store server key in environment variables (never in code)
- ✅ Use production keys only in production
- ✅ Implement rate limiting on webhook endpoint
- ✅ Log all webhook calls for audit
- ✅ Handle webhook retries (Midtrans retries failed webhooks)
- ✅ Set up monitoring for webhook failures

### Error Handling

#### Webhook Signature Invalid

```json
{
  "status": 403,
  "message": "Invalid signature"
}
```

**Solution**: Verify server key is correct, check signature calculation

#### Transaction Not Found

```json
{
  "status": 404,
  "message": "Transaction not found"
}
```

**Solution**: Verify order_id format, check if transaction exists in database

#### Billing Already Paid

```json
{
  "status": 400,
  "message": "Billing sudah dibayar"
}
```

**Solution**: This is a duplicate webhook, return 200 OK (idempotent)

### Monitoring & Debugging

#### Check Webhook Logs

```bash
# View real-time logs
pm2 logs

# Filter webhook logs
pm2 logs | grep "📨 Webhook"
```

#### Midtrans Dashboard

- View transaction history
- Check webhook delivery status
- Retry failed webhooks manually
- View payment method breakdown

#### Database Queries

```javascript
// Find pending transactions
db.transactions.find({ status: "pending" });

// Find unpaid billing
db.billings.find({ isPaid: false, dueDate: { $lt: new Date() } });

// Check meteran reset
db.meterans.find({ pemakaianBelumTerbayar: { $gt: 0 } });
```

---

## �📊 Database Indexes

Billing model has optimized indexes for fast queries:

```javascript
billingSchema.index({ userId: 1, periode: 1 });
billingSchema.index({ meteranId: 1, periode: 1 });
billingSchema.index({ isPaid: 1, dueDate: 1 });
```

---

## 🔒 Security Notes

1. **Admin Only**:

   - Generate billing (all/single)
   - Update payment status
   - Delete billing
   - View all billing
   - Monthly reports

2. **User Only**:

   - View own billing
   - Pay own billing (manual)
   - Create Midtrans payment
   - View unpaid bills

3. **No Auth Required**:

   - Midtrans webhook (`/billing/webhook`)

4. **Midtrans Security**:
   - Signature verification on webhook
   - HTTPS required for production
   - Server key stored in environment variables
   - Rate limiting recommended

---

## 📞 Support

For issues or questions:

- Check server logs for cron job execution
- Verify MongoDB connection
- Ensure `node-cron` package is installed
- Check timezone settings (default: Asia/Jakarta)
- **Midtrans**: Check webhook logs in dashboard
- **Midtrans**: Use sandbox for testing before production
- **Midtrans**: Contact Midtrans support for payment issues

---

**Last Updated**: January 25, 2024
**Version**: 2.0.0 (with Midtrans Integration)
