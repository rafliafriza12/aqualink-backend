# 📋 Handling Multiple Unpaid Bills - Dokumentasi

## 🎯 **Masalah yang Diselesaikan**

Sebelumnya, sistem memiliki **masalah kritis** dalam handling multiple unpaid bills:

### ❌ **Masalah Lama:**

```javascript
// User punya 3 tagihan menunggak:
- Bulan Jan: 10 m³ = Rp50,000
- Bulan Feb: 15 m³ = Rp75,000
- Bulan Mar: 12 m³ = Rp60,000
Total pemakaianBelumTerbayar = 37 m³

// User bayar HANYA bulan Jan
meteran.pemakaianBelumTerbayar = 0; // ❌ SALAH!
// Seharusnya masih 27 m³ (15 + 12)
```

**Dampak:**

- Kehilangan tracking usage yang belum dibayar
- Data `pemakaianBelumTerbayar` tidak akurat
- Monitoring usage jadi salah

---

## ✅ **Solusi yang Diimplementasikan**

### **1. Perbaiki Logic Reset `pemakaianBelumTerbayar`**

**Sebelum (SALAH):**

```javascript
// Bayar 1 billing → reset ke 0
meteran.pemakaianBelumTerbayar = 0; // ❌
```

**Sesudah (BENAR):**

```javascript
// Bayar 1 billing → kurangi sesuai usage yang dibayar
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
); // ✅
```

### **2. Tambah Fitur Bayar Semua Tagihan Sekaligus**

#### **A. Manual Payment (PUT /billing/pay-all)**

```javascript
// Endpoint: PUT /billing/pay-all
// Auth: verifyToken
// Body: { paymentMethod: "MANUAL" | "TRANSFER" | "EWALLET" }

// Response:
{
  "status": 200,
  "message": "Pembayaran semua tagihan berhasil",
  "data": {
    "totalBills": 3,
    "totalPemakaian": 37,
    "totalDenda": 5000,
    "totalPaid": 190000,
    "bills": [
      {
        "periode": "2024-01",
        "biayaAir": 45000,
        "biayaBeban": 5000,
        "denda": 2000,
        "total": 52000
      },
      // ... bills lainnya
    ]
  }
}
```

#### **B. Midtrans Payment (POST /billing/create-payment-all)**

```javascript
// Endpoint: POST /billing/create-payment-all
// Auth: verifyToken
// Body: tidak perlu

// Response:
{
  "status": 201,
  "message": "Payment link untuk semua tagihan berhasil dibuat",
  "data": {
    "orderId": "BILLING-MULTI-507f1f77bcf86cd799439011-1696348800000",
    "token": "snap_token_here",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v3/...",
    "summary": {
      "totalBills": 3,
      "totalAmount": 190000,
      "bills": [
        { "periode": "2024-01", "totalTagihan": 50000 },
        { "periode": "2024-02", "totalTagihan": 75000 },
        { "periode": "2024-03", "totalTagihan": 60000 }
      ]
    }
  }
}
```

### **3. Update Webhook untuk Handle Multiple Bills**

**Order ID Format:**

- Single bill: `BILLING-{billingId}`
- Multiple bills: `BILLING-MULTI-{userId}-{timestamp}`

**Webhook Handler Logic:**

```javascript
if (order_id.startsWith("BILLING-MULTI-")) {
  // Handle multiple billing payment
  await handleMultipleBillingPayment(
    order_id,
    transaction_status,
    notification
  );
} else if (order_id.startsWith("BILLING-")) {
  // Handle single billing payment
  await handleBillingPayment(order_id, transaction_status, notification);
}
```

---

## 📊 **Flow Lengkap dengan Multiple Unpaid Bills**

### **Scenario 1: User Bayar Satu per Satu**

```
Initial State:
- Billing Jan: 10 m³, unpaid
- Billing Feb: 15 m³, unpaid
- Billing Mar: 12 m³, unpaid
- pemakaianBelumTerbayar = 37 m³

Step 1: User bayar billing Jan (10 m³)
→ billing Jan: isPaid = true
→ pemakaianBelumTerbayar = 37 - 10 = 27 m³ ✅

Step 2: User bayar billing Feb (15 m³)
→ billing Feb: isPaid = true
→ pemakaianBelumTerbayar = 27 - 15 = 12 m³ ✅

Step 3: User bayar billing Mar (12 m³)
→ billing Mar: isPaid = true
→ pemakaianBelumTerbayar = 12 - 12 = 0 m³ ✅
```

### **Scenario 2: User Bayar Semua Sekaligus**

```
Initial State:
- Billing Jan: 10 m³, unpaid
- Billing Feb: 15 m³, unpaid
- Billing Mar: 12 m³, unpaid
- pemakaianBelumTerbayar = 37 m³

User bayar semua (via PUT /billing/pay-all atau Midtrans)
→ All billings: isPaid = true
→ pemakaianBelumTerbayar = 37 - 37 = 0 m³ ✅
```

### **Scenario 3: User Punya Tagihan Baru Setelah Bayar Sebagian**

```
Initial State:
- Billing Jan: 10 m³, unpaid
- Billing Feb: 15 m³, unpaid
- pemakaianBelumTerbayar = 25 m³

Step 1: User bayar billing Jan (10 m³)
→ pemakaianBelumTerbayar = 25 - 10 = 15 m³ ✅

Step 2: IoT kirim usage baru 8 m³
→ pemakaianBelumTerbayar = 15 + 8 = 23 m³ ✅

Step 3: Cron buat billing Mar (8 m³)
→ pemakaianBelumTerbayar tetap 23 m³ ✅

Step 4: User bayar semua (billing Feb + Mar)
→ pemakaianBelumTerbayar = 23 - 23 = 0 m³ ✅
```

---

## 🔧 **File yang Dimodifikasi**

### **1. `controllers/billingController.js`**

**Perbaikan di payBilling (Manual Payment Single Bill):**

```javascript
// Line ~510: Kurangi, bukan reset
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
);
```

**Perbaikan di Midtrans Webhook (Line ~750, ~780):**

```javascript
// Kurangi, bukan reset
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
);
```

**Perbaikan di updatePaymentStatus (Admin Update):**

```javascript
if (isPaid && !wasPaid) {
  // Kurangi saat bayar
  meteran.pemakaianBelumTerbayar = Math.max(
    0,
    meteran.pemakaianBelumTerbayar - billing.totalPemakaian
  );
} else if (!isPaid && wasPaid) {
  // Restore saat cancel
  meteran.pemakaianBelumTerbayar += billing.totalPemakaian;
}
```

**Function Baru: payAllBilling (Line ~560)**

- Bayar semua tagihan yang belum dibayar secara manual
- Hitung total denda untuk semua billing
- Update semua billing sekaligus
- Kurangi `pemakaianBelumTerbayar` sesuai total usage

**Function Baru: createPaymentForAllBills (Line ~670)**

- Create Midtrans payment link untuk semua billing
- Order ID format: `BILLING-MULTI-{userId}-{timestamp}`
- Item details berisi semua billing + denda
- Store billing IDs di custom_field1

### **2. `controllers/paymentWebhookController.js`**

**Perbaikan di handleBillingPayment (Line ~260):**

```javascript
// Kurangi, bukan reset
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
);
```

**Function Baru: handleMultipleBillingPayment (Line ~310)**

- Extract userId dari order_id format `BILLING-MULTI-{userId}-{timestamp}`
- Get all unpaid billings untuk user tersebut
- Update semua billings sekaligus
- Kurangi `pemakaianBelumTerbayar` sesuai total usage
- Create single notification untuk semua billing

### **3. `routes/billingRoutes.js`**

**Endpoint Baru:**

```javascript
// Manual payment semua billing
billingRouter.put("/pay-all", verifyToken, payAllBilling);

// Create Midtrans link untuk semua billing
billingRouter.post(
  "/create-payment-all",
  verifyToken,
  createPaymentForAllBills
);
```

---

## 🧪 **Testing Checklist**

### **Test 1: Bayar Single Bill dengan Multiple Unpaid Bills**

```bash
# Setup: User punya 3 billing unpaid (10m³, 15m³, 12m³)
# Expected pemakaianBelumTerbayar = 37 m³

# Bayar billing 1 (10 m³)
PUT /billing/{billing1_id}/pay
Body: { "paymentMethod": "MANUAL" }

# Expected Result:
✅ billing1.isPaid = true
✅ pemakaianBelumTerbayar = 27 m³ (37 - 10)
```

### **Test 2: Bayar All Bills Manually**

```bash
# Setup: User punya 3 billing unpaid
# Expected pemakaianBelumTerbayar = 37 m³

# Bayar semua
PUT /billing/pay-all
Body: { "paymentMethod": "TRANSFER" }

# Expected Result:
✅ All billings isPaid = true
✅ pemakaianBelumTerbayar = 0 m³
✅ Notification created
```

### **Test 3: Create Midtrans Link untuk All Bills**

```bash
# Setup: User punya 3 billing unpaid

# Create payment link
POST /billing/create-payment-all
Headers: { "Authorization": "Bearer {token}" }

# Expected Result:
✅ orderId format: BILLING-MULTI-{userId}-{timestamp}
✅ grossAmount = sum of all bills + denda
✅ item_details contains all bills
```

### **Test 4: Webhook untuk Multiple Bills Payment**

```bash
# Setup: User sudah create payment dengan orderId BILLING-MULTI-xxx

# Simulate Midtrans webhook
POST /webhook/payment
Body: {
  "order_id": "BILLING-MULTI-507f1f77bcf86cd799439011-1696348800000",
  "transaction_status": "settlement",
  "gross_amount": "190000",
  "signature_key": "valid_signature"
}

# Expected Result:
✅ All unpaid billings updated to isPaid = true
✅ pemakaianBelumTerbayar = 0
✅ Notification created
```

### **Test 5: Admin Cancel Payment dengan Multiple Unpaid Bills**

```bash
# Setup: User punya 2 billing, 1 sudah dibayar (10m³), 1 belum (15m³)
# Expected pemakaianBelumTerbayar = 15 m³

# Admin cancel payment yang sudah dibayar
PUT /billing/{billing_id}/payment-status
Body: { "isPaid": false }

# Expected Result:
✅ billing.isPaid = false
✅ pemakaianBelumTerbayar = 25 m³ (15 + 10 restored)
```

---

## 📝 **API Documentation**

### **1. Get Unpaid Billing**

```
GET /billing/unpaid
Auth: verifyToken

Response:
{
  "status": 200,
  "data": {
    "bills": [
      {
        "_id": "...",
        "periode": "2024-01",
        "totalTagihan": 50000,
        "daysLate": 5,
        "denda": 2000,
        "totalWithDenda": 52000
      }
    ],
    "totalUnpaid": 190000,
    "count": 3
  }
}
```

### **2. Pay Single Billing**

```
PUT /billing/:id/pay
Auth: verifyToken
Body: { "paymentMethod": "MANUAL" }

Response:
{
  "status": 200,
  "message": "Pembayaran berhasil",
  "data": {
    "billing": {...},
    "summary": {
      "periode": "2024-01",
      "denda": 2000,
      "totalPaid": 52000
    }
  }
}
```

### **3. Pay All Billing**

```
PUT /billing/pay-all
Auth: verifyToken
Body: { "paymentMethod": "TRANSFER" }

Response:
{
  "status": 200,
  "message": "Pembayaran semua tagihan berhasil",
  "data": {
    "totalBills": 3,
    "totalPemakaian": 37,
    "totalDenda": 5000,
    "totalPaid": 190000,
    "bills": [...]
  }
}
```

### **4. Create Payment for Single Bill**

```
POST /billing/:id/create-payment
Auth: verifyToken

Response:
{
  "status": 201,
  "data": {
    "orderId": "BILLING-507f1f77bcf86cd799439011",
    "token": "snap_token",
    "redirectUrl": "https://..."
  }
}
```

### **5. Create Payment for All Bills**

```
POST /billing/create-payment-all
Auth: verifyToken

Response:
{
  "status": 201,
  "data": {
    "orderId": "BILLING-MULTI-507f1f77bcf86cd799439011-1696348800000",
    "token": "snap_token",
    "redirectUrl": "https://...",
    "summary": {
      "totalBills": 3,
      "totalAmount": 190000
    }
  }
}
```

---

## 🎯 **Keuntungan Solusi Ini**

### ✅ **Akurat**

- `pemakaianBelumTerbayar` selalu akurat
- Tidak ada kehilangan tracking data
- Mendukung pembayaran bertahap

### ✅ **Fleksibel**

- User bisa bayar satu per satu
- User bisa bayar semua sekaligus
- Mendukung manual payment & Midtrans

### ✅ **User-Friendly**

- Lebih mudah bayar semua tagihan dalam 1 transaksi
- Hemat waktu dan biaya transaksi
- Notification yang jelas

### ✅ **Robust**

- Handle edge cases (cancel payment, admin update, dll)
- Validation yang ketat
- Error handling yang baik

---

## ⚠️ **Catatan Penting**

### **1. Math.max(0, value) untuk Safety**

```javascript
// Selalu gunakan Math.max untuk avoid negative value
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
);
```

### **2. Order ID Format Matters**

- `BILLING-{id}`: Single billing payment
- `BILLING-MULTI-{userId}-{timestamp}`: Multiple billing payment
- RAB tetap gunakan `RAB-{id}`

### **3. Webhook Harus Handle Semua Scenario**

- Single billing payment
- Multiple billing payment
- RAB payment
- Invalid order_id format

### **4. Notification Harus Informatif**

```javascript
// Single bill
"Pembayaran tagihan air periode 2024-01 sebesar Rp52,000 telah berhasil";

// Multiple bills
"Pembayaran 3 tagihan air sebesar Rp190,000 telah berhasil";
```

---

**Terakhir diupdate:** 3 Oktober 2025
**Status:** ✅ Sudah diperbaiki dan siap production
