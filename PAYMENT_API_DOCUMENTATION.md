# API Payment Endpoints Documentation

## 📋 Overview

Dokumentasi lengkap untuk endpoint pembayaran RAB dan Billing menggunakan Midtrans Payment Gateway.

---

## 🔧 RAB Payment Endpoint

### Create RAB Payment Transaction

Membuat transaksi pembayaran untuk RAB (Rencana Anggaran Biaya) menggunakan Midtrans.

**Endpoint:**

```
POST /rab-connection/:rabId/pay
```

**Authentication:** Required (JWT Token)

**Headers:**

```
Authorization: Bearer {token}
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| rabId | String (ObjectId) | ID dari RAB yang akan dibayar |

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Payment transaction created successfully",
  "data": {
    "token": "7e3b8c9d-1f2a-4b5e-8c7d-9f1a2b3c4d5e",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/7e3b8c9d-1f2a-4b5e-8c7d-9f1a2b3c4d5e",
    "orderId": "RAB-67890abcdef12345",
    "grossAmount": 5000000
  }
}
```

**Response Error (404):**

```json
{
  "status": 404,
  "message": "RAB not found"
}
```

**Response Error (403):**

```json
{
  "status": 403,
  "message": "Unauthorized to pay this RAB"
}
```

**Response Error (400):**

```json
{
  "status": 400,
  "message": "RAB already paid"
}
```

**Example Usage (Frontend):**

```typescript
const handlePayRAB = async (rabId: string) => {
  try {
    const response = await fetch(`/api/rab-connection/${rabId}/pay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status === 200) {
      // Redirect to Midtrans payment page
      window.location.href = data.data.redirectUrl;

      // OR use Snap.js
      snap.pay(data.data.token, {
        onSuccess: (result) => {
          console.log("Payment success:", result);
          // Redirect to success page
          window.location.href = "/rab/success";
        },
        onPending: (result) => {
          console.log("Payment pending:", result);
          window.location.href = "/rab/pending";
        },
        onError: (result) => {
          console.log("Payment error:", result);
          window.location.href = "/rab/error";
        },
      });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
  }
};
```

---

## 💧 Billing Payment Endpoint

### Create Billing Payment Transaction

Membuat transaksi pembayaran untuk Billing (tagihan air bulanan) menggunakan Midtrans.

**Endpoint:**

```
POST /billing/:billingId/pay
```

**Authentication:** Required (JWT Token)

**Headers:**

```
Authorization: Bearer {token}
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| billingId | String (ObjectId) | ID dari billing yang akan dibayar |

**Response Success (200):**

```json
{
  "status": 200,
  "message": "Snap token created successfully",
  "data": {
    "token": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "orderId": "BILLING-67890abcdef12345",
    "grossAmount": 150000,
    "billing": {
      "_id": "67890abcdef12345",
      "periode": "2024-10",
      "totalPemakaian": 10,
      "biayaAir": 100000,
      "biayaBeban": 50000,
      "totalTagihan": 150000,
      "dueDate": "2024-10-15T00:00:00.000Z",
      "isOverdue": false,
      "denda": 0
    }
  }
}
```

**Response Error (404):**

```json
{
  "status": 404,
  "message": "Billing not found"
}
```

**Response Error (403):**

```json
{
  "status": 403,
  "message": "Unauthorized to pay this billing"
}
```

**Response Error (400):**

```json
{
  "status": 400,
  "message": "Billing already paid"
}
```

**Example Usage (Frontend):**

```typescript
const handlePayBilling = async (billingId: string) => {
  try {
    const response = await fetch(`/api/billing/${billingId}/pay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status === 200) {
      // Use Snap.js to open payment popup
      snap.pay(data.data.token, {
        onSuccess: (result) => {
          console.log("Payment success:", result);
          // Refresh billing list or redirect
          router.push("/pembayaran/success");
        },
        onPending: (result) => {
          console.log("Payment pending:", result);
          router.push("/pembayaran/pending");
        },
        onError: (result) => {
          console.log("Payment error:", result);
          alert("Pembayaran gagal, silakan coba lagi");
        },
        onClose: () => {
          console.log("Payment popup closed");
        },
      });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
  }
};
```

---

## 🔔 Payment Webhook

Setelah user melakukan pembayaran, Midtrans akan mengirimkan notifikasi ke webhook backend.

**Webhook Endpoint:**

```
POST /webhook/payment
```

**Order ID Formats:**

- RAB Payment: `RAB-{rabId}`
- Billing Payment: `BILLING-{billingId}`

**Webhook Actions:**

### RAB Payment Webhook:

1. Update `RabConnection.isPaid` = true (jika success)
2. Create notification untuk user
3. Log payment details

### Billing Payment Webhook:

1. Update `Billing.isPaid` = true
2. Update `Billing.paidAt` = timestamp
3. Update `Billing.paymentMethod` = payment type
4. Reset `Meteran.pemakaianBelumTerbayar` = 0
5. Create notification untuk user
6. Log payment details

**Transaction Status:**

- `capture` / `settlement` → Payment SUCCESS ✅
- `pending` → Payment PENDING ⏳
- `deny` / `cancel` / `expire` → Payment FAILED ❌

**Notifications Created:**

- Title menggunakan emoji untuk visual (✅, ⏳, ❌, 💧)
- Category: "PEMBAYARAN"
- Link: `/pembayaran` (billing) atau `/rab/{rabId}` (RAB)

---

## 🔐 Security

### JWT Authentication

- Semua payment endpoint memerlukan JWT token valid
- Token berisi `userId` untuk verify ownership
- User hanya bisa bayar RAB/Billing milik sendiri

### Midtrans Signature Verification

- Webhook menggunakan SHA512 signature verification
- Signature: `sha512(order_id + status_code + gross_amount + server_key)`
- Hanya request dengan signature valid yang diproses

### Environment Variables

```env
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false # true untuk production
FRONTEND_URL=http://localhost:3000
```

---

## 📝 Payment Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Click "Bayar"
       ↓
┌─────────────────────────┐
│ Frontend Call Payment   │
│ POST /rab-connection/   │
│      :rabId/pay         │
│   OR                    │
│ POST /billing/          │
│      :billingId/pay     │
└──────────┬──────────────┘
           │ 2. Return Snap Token
           ↓
    ┌──────────────┐
    │   Midtrans   │
    │ Payment Page │
    └──────┬───────┘
           │ 3. User pays
           ↓
    ┌──────────────┐
    │   Midtrans   │
    │   Server     │
    └──────┬───────┘
           │ 4. Send webhook notification
           ↓
┌──────────────────────────┐
│  Backend Webhook Handler │
│  POST /webhook/payment   │
└──────────┬───────────────┘
           │ 5. Update DB & Notify User
           ↓
    ┌─────────────┐
    │  Database   │
    │   Updated   │
    └─────────────┘
```

---

## 🧪 Testing

### Test RAB Payment (Postman/Thunder Client)

```bash
POST http://localhost:5000/api/rab-connection/67890abcdef12345/pay
Authorization: Bearer your_jwt_token
```

### Test Billing Payment (Postman/Thunder Client)

```bash
POST http://localhost:5000/api/billing/67890abcdef12345/pay
Authorization: Bearer your_jwt_token
```

### Test Webhook (Manual)

Lihat [WEBHOOK_DOCUMENTATION.md](./WEBHOOK_DOCUMENTATION.md) untuk detail testing webhook.

---

## 📞 Support

Untuk pertanyaan atau issue, silakan hubungi tim development atau buat issue di repository.
