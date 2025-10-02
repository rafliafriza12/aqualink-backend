# Payment Webhook Documentation

## Overview

Webhook endpoint untuk menerima notifikasi pembayaran dari Midtrans untuk sistem Aqualink.

## Endpoint

```
POST /webhook/payment
```

## Authentication

- **TIDAK menggunakan JWT token** (Midtrans tidak bisa mengirim custom headers)
- Menggunakan **SHA512 Signature Verification** untuk keamanan
- Signature diverifikasi menggunakan `MIDTRANS_SERVER_KEY`

## Supported Payment Types

### 1. RAB Payment (Rencana Anggaran Biaya)

**Order ID Format:** `RAB-{rabId}`

**Contoh:** `RAB-67890abcdef12345`

**Flow:**

1. User request pemasangan meteran baru
2. Teknisi approve dan buat RAB dengan total biaya
3. User klik "Bayar RAB" → call endpoint `POST /rab-connection/:rabId/pay`
4. Backend create Midtrans transaction dan return Snap token
5. User redirect ke Midtrans payment page
6. User bayar via Midtrans
7. Midtrans kirim notifikasi ke webhook
8. Webhook update status RAB menjadi "paid" (isPaid = true)
9. User dapat notifikasi pembayaran berhasil
10. Teknisi bisa mulai proses pemasangan

**Status Update:**

- `isPaid` → true (jika settlement/capture success)
- `isPaid` → false (jika pending/deny/cancel/expire)

**Notification Created:**

- ✅ Success: "Pembayaran RAB Berhasil"
- ⏳ Pending: "Pembayaran RAB Pending"
- ❌ Failed: "Pembayaran RAB Gagal"

### 2. Billing Payment (Tagihan Bulanan Air)

**Order ID Format:** `BILLING-{billingId}`

**Contoh:** `BILLING-67890abcdef12345`

**Flow:**

1. Sistem auto-generate billing setiap bulan (via cron)
2. User lihat tagihan di halaman "Pembayaran"
3. User klik "Bayar" → call endpoint `POST /billing/:billingId/pay`
4. Backend create Midtrans transaction dan return Snap token
5. User redirect ke Midtrans payment page
6. User bayar via Midtrans
7. Midtrans kirim notifikasi ke webhook
8. Webhook update status billing:
   - Set `isPaid` = true
   - Set `paidAt` = timestamp
   - Set `paymentMethod` = payment type
   - Reset `meteran.pemakaianBelumTerbayar` menjadi 0
9. User dapat notifikasi dan bisa lihat riwayat pembayaran

**Status Update:**

- `isPaid` → true
- `paidAt` → timestamp pembayaran
- `paymentMethod` → jenis pembayaran (gopay, bank_transfer, dll)
- `notes` → detail pembayaran dengan timestamp
- **Bonus:** Reset `meteran.pemakaianBelumTerbayar` → 0

**Notification Created:**

- 💧 Success: "Pembayaran Tagihan Air Berhasil"
- ⏳ Pending: "Pembayaran Tagihan Pending"
- ❌ Failed: "Pembayaran Tagihan Gagal"

## Transaction Status Handling

### Success Status

#### `capture` (Credit Card)

- Cek `fraud_status` harus "accept"
- Update status menjadi lunas/paid
- Kirim notifikasi sukses ke user

#### `settlement` (Bank Transfer, E-Wallet, dll)

- Update status menjadi lunas/paid
- Kirim notifikasi sukses ke user

### Pending Status

#### `pending`

- Status masih pending
- Kirim notifikasi pending ke user
- User perlu selesaikan pembayaran

### Failed Status

#### `deny`, `cancel`, `expire`

- Pembayaran ditolak/dibatalkan/kadaluarsa
- Kirim notifikasi gagal ke user
- User bisa coba bayar lagi

## Request Body (dari Midtrans)

```json
{
  "order_id": "BILLING-67890abcdef12345",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "gross_amount": "125000.00",
  "payment_type": "gopay",
  "transaction_time": "2025-10-02 14:30:00",
  "signature_key": "abc123...",
  "status_code": "200"
}
```

## Response Format

### Success

```json
{
  "status": "success",
  "message": "Notification processed successfully"
}
```

### Error - Invalid Signature

```json
{
  "status": "error",
  "message": "Invalid signature"
}
```

### Error - Unknown Order ID

```json
{
  "status": "error",
  "message": "Unknown order_id format"
}
```

## Notification System

Setiap webhook akan membuat notifikasi untuk user dengan kategori "PEMBAYARAN":

### RAB Payment Success

- 📱 **Title:** "✅ Pembayaran RAB Berhasil"
- 📱 **Message:** "Pembayaran RAB sebesar Rp125.000 telah berhasil. Pemasangan akan segera dijadwalkan."

### Billing Payment Success

- 📱 **Title:** "💧 Pembayaran Tagihan Air Berhasil"
- 📱 **Message:** "Pembayaran tagihan air sebesar Rp125.000 untuk periode Sep 2025 telah berhasil. Terima kasih!"

### Payment Pending

- 📱 **Title:** "⏳ Pembayaran Pending"
- 📱 **Message:** "Pembayaran sedang diproses. Mohon selesaikan pembayaran Anda."

### Payment Failed

- 📱 **Title:** "❌ Pembayaran Gagal"
- 📱 **Message:** "Pembayaran sebesar Rp125.000 gagal atau dibatalkan. Silakan coba lagi."

## Security Features

### 1. Signature Verification

```javascript
const hash = crypto
  .createHash("sha512")
  .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
  .digest("hex");

if (hash !== signature_key) {
  return res
    .status(403)
    .json({ status: "error", message: "Invalid signature" });
}
```

### 2. Order ID Format Validation

- Hanya terima order_id dengan format `RAB-xxx` atau `BILLING-xxx`
- Reject format lain dengan status 400

### 3. Fraud Status Check

- Untuk payment type "capture", cek `fraud_status` harus "accept"
- Prevent fraudulent transactions

## Konfigurasi Midtrans Dashboard

### 1. Login ke Dashboard

https://dashboard.midtrans.com

### 2. Pilih Environment

- **Sandbox** (untuk testing)
- **Production** (untuk live)

### 3. Settings → Configuration

#### Payment Notification URL

```
https://your-backend-domain.com/webhook/payment
```

#### Finish Redirect URL (Frontend)

```
https://your-frontend-domain.com/payment-success
```

#### Unfinish Redirect URL (Frontend)

```
https://your-frontend-domain.com/payment-pending
```

#### Error Redirect URL (Frontend)

```
https://your-frontend-domain.com/payment-failed
```

### 4. Allowed Payment Methods

Centang payment methods yang diinginkan:

- ✅ Credit Card
- ✅ GoPay
- ✅ Bank Transfer (BCA, Mandiri, BNI, dll)
- ✅ QRIS
- ✅ Alfamart/Indomaret
- ✅ dll

## Environment Variables

Pastikan `.env` sudah di-set:

```env
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here
MIDTRANS_IS_PRODUCTION=false  # true untuk production
```

## Testing Webhook

### 1. Using Midtrans Simulator (Sandbox)

https://simulator.sandbox.midtrans.com

### 2. Using ngrok (Local Development)

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 5000

# Copy URL dan set di Midtrans Dashboard
https://abc123.ngrok.io/webhook/payment
```

### 3. Manual Test via Postman/cURL

```bash
curl -X POST http://localhost:5000/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "BILLING-67890abcdef12345",
    "transaction_status": "settlement",
    "fraud_status": "accept",
    "gross_amount": "125000.00",
    "payment_type": "bank_transfer",
    "transaction_time": "2025-10-02 14:30:00",
    "signature_key": "calculated_hash_here",
    "status_code": "200"
  }'
```

## Logging

Webhook sudah dilengkapi dengan logging untuk debugging:

```
📨 Webhook received: { order_id: 'BILLING-123', transaction_status: 'settlement', ... }
✅ Signature verified
✅ Billing payment updated: 123 - Status: settlement
✅ Reset pemakaianBelumTerbayar untuk meteran: 456
```

## Error Handling

Semua error akan di-catch dan di-log:

```
❌ Invalid signature from Midtrans
❌ RAB not found: 123
❌ Billing not found: 456
❌ Error handling RAB payment: [error details]
```

## Flow Diagram

```
User → Frontend → Midtrans Payment Page
                      ↓
                 User bayar
                      ↓
            Midtrans process payment
                      ↓
         Midtrans kirim webhook ke backend
                      ↓
              Backend verify signature
                      ↓
         Backend update RAB/Billing status
                      ↓
           Backend create notification
                      ↓
              Response 200 OK
                      ↓
        Frontend polling/check payment status
```

## Important Notes

1. **Webhook HARUS di-deploy dengan HTTPS** untuk production
2. **Webhook endpoint TIDAK boleh ada JWT authentication** (Midtrans tidak bisa kirim token)
3. **Order ID format sangat penting** (`RAB-xxx` atau `BILLING-xxx`)
4. **Signature verification wajib** untuk keamanan
5. **Response 200 OK wajib** agar Midtrans tidak retry berkali-kali
6. **Idempotency:** Webhook bisa dipanggil multiple times untuk same transaction, pastikan handle dengan benar

## Troubleshooting

### Webhook tidak dipanggil

- ✅ Cek Payment Notification URL di Midtrans Dashboard
- ✅ Pastikan server accessible dari internet (tidak localhost)
- ✅ Cek firewall/security group

### Invalid Signature Error

- ✅ Cek MIDTRANS_SERVER_KEY di .env
- ✅ Pastikan menggunakan Server Key yang benar (Sandbox vs Production)
- ✅ Cek format signature calculation

### Payment success tapi status tidak update

- ✅ Cek logs di server
- ✅ Cek order_id format benar (`RAB-xxx` atau `BILLING-xxx`)
- ✅ Cek RAB/Billing ID ada di database

## Support

Untuk pertanyaan lebih lanjut:

- Midtrans Docs: https://docs.midtrans.com
- Midtrans Support: support@midtrans.com
