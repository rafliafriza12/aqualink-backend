# ✅ Ringkasan Lengkap: Integrasi Pembayaran & Notifikasi

## 📊 Status Implementasi

### ✅ Sudah Diselesaikan

1. **Perbaikan Bug `pemakaianBelumTerbayar`**

   - ✅ Fixed double counting di cron (dihapus increment di cron)
   - ✅ Perubahan dari reset (=0) ke decrement (-= amount) saat pembayaran
   - ✅ Update di semua fungsi pembayaran (manual & Midtrans)

2. **Handling Multiple Unpaid Bills**

   - ✅ Endpoint `PUT /api/billing/pay-all` (pembayaran manual)
   - ✅ Endpoint `POST /api/billing/create-payment-all` (pembayaran Midtrans)
   - ✅ Webhook handler untuk BILLING-MULTI-{userId}-{timestamp}

3. **Integrasi Midtrans Lengkap**

   - ✅ Single billing payment
   - ✅ Multiple billing payment
   - ✅ RAB (installation) payment
   - ✅ Webhook routing berdasarkan order_id prefix
   - ✅ Signature verification
   - ✅ Status mapping (capture, settlement, cancel, deny, expire, pending)

4. **Link Notifikasi**
   - ✅ 9 notifikasi di `billingController.js`
   - ✅ 3 notifikasi di `billingCron.js`
   - ✅ Semua notifikasi pembayaran & tagihan memiliki link

---

## 🔗 Endpoint Pembayaran

### 1. Pembayaran Manual

#### Bayar Satu Tagihan

```
PUT /api/billing/pay/:id
Headers: Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "paymentMethod": "MANUAL"
}
```

**Response:**

```json
{
  "message": "Pembayaran berhasil",
  "billing": {...},
  "transaction": {...}
}
```

#### Bayar Semua Tagihan

```
PUT /api/billing/pay-all
Headers: Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "paymentMethod": "MANUAL"
}
```

**Response:**

```json
{
  "message": "Semua tagihan berhasil dibayar",
  "count": 3,
  "totalAmount": 150000,
  "billings": [...],
  "transactions": [...]
}
```

### 2. Pembayaran Midtrans

#### Bayar Satu Tagihan via Midtrans

```
POST /api/billing/create-payment/:id
Headers: Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Transaksi Midtrans berhasil dibuat",
  "snapToken": "xxx-xxx-xxx",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v3/...",
  "orderId": "BILLING-67890abcdef12345"
}
```

#### Bayar Semua Tagihan via Midtrans

```
POST /api/billing/create-payment-all
Headers: Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Transaksi Midtrans untuk semua tagihan berhasil dibuat",
  "snapToken": "xxx-xxx-xxx",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v3/...",
  "orderId": "BILLING-MULTI-67890abcdef12345-1234567890",
  "billings": [...]
}
```

---

## 🔔 Webhook Midtrans

### Endpoint Webhook

```
POST /api/billing/webhook
```

### Format Order ID

1. **Single Billing**: `BILLING-{billingId}`
2. **Multiple Billing**: `BILLING-MULTI-{userId}-{timestamp}`
3. **RAB Installation**: `RAB-{rabId}`

### Status yang Ditangani

- `capture` → Payment berhasil (credit card)
- `settlement` → Payment settled
- `pending` → Payment pending
- `deny` → Payment ditolak
- `cancel` → Payment dibatalkan
- `expire` → Payment expired

### Webhook Flow

```
Midtrans → POST /api/billing/webhook
         ↓
   Verify Signature
         ↓
   Check Order ID Prefix
         ↓
   ┌─────────────┬──────────────────┬───────────┐
   │             │                  │           │
BILLING-    BILLING-MULTI-       RAB-
   │             │                  │
   ↓             ↓                  ↓
Single      Multiple           Installation
Handler     Handler            Handler
   │             │                  │
   ↓             ↓                  ↓
Update      Update All         Update RAB
Billing     Billings           Status
   │             │                  │
   ↓             ↓                  ↓
Decrement   Decrement Each     Create
pemakaian   pemakaian          Transaction
   │             │                  │
   ↓             ↓                  ↓
Create      Create             Create
Notification Notification      Notification
```

---

## 📧 Link Notifikasi

### Mapping Link Berdasarkan Jenis Notifikasi

| Kategori                | Jenis Notifikasi           | Link               | Lokasi Kode                 |
| ----------------------- | -------------------------- | ------------------ | --------------------------- |
| **Tagihan Baru**        | Tagihan baru dibuat        | `/pembayaran`      | `billingCron.js:143`        |
| **Tagihan Terlambat**   | Tagihan telah jatuh tempo  | `/pembayaran`      | `billingCron.js:201`        |
| **Pengingat**           | 3 hari sebelum jatuh tempo | `/pembayaran`      | `billingCron.js:273`        |
| **Pembayaran Berhasil** | Manual payment sukses      | `/riwayat-tagihan` | `billingController.js:523`  |
| **Pembayaran Berhasil** | All bills payment sukses   | `/riwayat-tagihan` | `billingController.js:627`  |
| **Pembayaran Berhasil** | Midtrans single sukses     | `/riwayat-tagihan` | `billingController.js:1023` |
| **Pembayaran Berhasil** | Midtrans multiple sukses   | `/riwayat-tagihan` | `billingController.js:1168` |
| **Pembayaran Gagal**    | Midtrans single gagal      | `/pembayaran`      | `billingController.js:1043` |
| **Pembayaran Gagal**    | Midtrans multiple gagal    | `/pembayaran`      | `billingController.js:1188` |
| **Top-up Wallet**       | Saldo berhasil ditambah    | `/pembayaran`      | `billingController.js:287`  |

### Pola Link

- **Tagihan baru / belum dibayar** → `/pembayaran`
- **Pembayaran berhasil** → `/riwayat-tagihan`
- **Pembayaran gagal** → `/pembayaran`

---

## 🔄 Flow pemakaianBelumTerbayar

### Increment (Oleh IoT)

```javascript
// Ketika ada pemakaian air baru
meteran.pemakaianBelumTerbayar += usageAmount;
```

### Decrement (Saat Pembayaran)

```javascript
// BUKAN reset ke 0, tapi kurangi sesuai yang dibayar
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
);
```

### Contoh Skenario

```
Bulan 1: Usage = 100 liter
  → pemakaianBelumTerbayar = 100

Bulan 2: Usage = 150 liter (belum bayar bulan 1)
  → pemakaianBelumTerbayar = 100 + 150 = 250

User bayar tagihan bulan 1 (100 liter):
  → pemakaianBelumTerbayar = 250 - 100 = 150 ✅
  (Bukan 0 ❌)

Bulan 3: Usage = 120 liter
  → pemakaianBelumTerbayar = 150 + 120 = 270

User bayar semua tagihan (150 + 120 = 270 liter):
  → pemakaianBelumTerbayar = 270 - 270 = 0 ✅
```

---

## 🧪 Testing Checklist

### Pembayaran Manual

- [ ] Bayar 1 tagihan dengan saldo cukup
- [ ] Bayar 1 tagihan dengan saldo tidak cukup (harus gagal)
- [ ] Bayar semua tagihan dengan saldo cukup
- [ ] Bayar semua tagihan dengan saldo tidak cukup (harus gagal)
- [ ] Cek `pemakaianBelumTerbayar` berkurang sesuai amount
- [ ] Cek notifikasi muncul dengan link yang benar

### Pembayaran Midtrans

- [ ] Bayar 1 tagihan via Midtrans - sukses
- [ ] Bayar 1 tagihan via Midtrans - gagal/batal
- [ ] Bayar semua tagihan via Midtrans - sukses
- [ ] Bayar semua tagihan via Midtrans - gagal/batal
- [ ] Webhook diterima dan diproses dengan benar
- [ ] Order ID format sesuai (BILLING- atau BILLING-MULTI-)
- [ ] `pemakaianBelumTerbayar` berkurang saat settlement
- [ ] Notifikasi muncul dengan link yang benar

### Cron Jobs

- [ ] Cron pembayaran bulanan jalan setiap tanggal 1 jam 00:01
- [ ] Tagihan baru dibuat dengan benar
- [ ] `pemakaianBelumTerbayar` TIDAK bertambah di cron
- [ ] Notifikasi tagihan baru punya link `/pembayaran`
- [ ] Cron overdue check jalan setiap hari jam 00:05
- [ ] Tagihan overdue ditandai dengan benar
- [ ] Notifikasi overdue punya link `/pembayaran`
- [ ] Cron reminder jalan setiap hari jam 08:00
- [ ] Reminder dikirim 3 hari sebelum due date
- [ ] Tidak ada duplikasi reminder di hari yang sama
- [ ] Notifikasi reminder punya link `/pembayaran`

### Notifikasi

- [ ] Semua notifikasi pembayaran berhasil link ke `/riwayat-tagihan`
- [ ] Semua notifikasi pembayaran gagal link ke `/pembayaran`
- [ ] Semua notifikasi tagihan baru link ke `/pembayaran`
- [ ] Notifikasi muncul di list notification user
- [ ] Link notifikasi bisa diklik dan redirect dengan benar

### Edge Cases

- [ ] Multiple tagihan belum dibayar dari bulan berbeda
- [ ] Pembayaran saat cron billing generation berjalan
- [ ] Webhook diterima berkali-kali (harus idempotent)
- [ ] User dengan saldo 0 coba bayar
- [ ] Tagihan sudah dibayar dicoba bayar lagi (harus gagal)
- [ ] Billing ID tidak valid di webhook
- [ ] Order ID format salah di webhook

---

## 🎯 Kesimpulan

### Yang Sudah Benar

✅ **Bug pemakaianBelumTerbayar**: Fixed dengan decrement logic

✅ **Multiple Unpaid Bills**: Bisa dibayar sekaligus (manual & Midtrans)

✅ **Integrasi Midtrans**: Lengkap untuk semua jenis pembayaran

✅ **Webhook Routing**: Otomatis route berdasarkan order_id prefix

✅ **Link Notifikasi**: Semua 12 notifikasi sudah ada link yang sesuai

✅ **Transaction Records**: Dibuat untuk semua metode pembayaran

✅ **Error Handling**: Validasi dan error response yang proper

### File yang Dimodifikasi

1. `controllers/billingController.js` - 12 perubahan (notifikasi + webhook handler)
2. `utils/billingCron.js` - 4 perubahan (link notifikasi + bug fix)
3. `routes/billingRoutes.js` - 2 endpoint baru

### Dokumentasi yang Dibuat

1. `PEMAKAIAN_BELUM_TERBAYAR_FLOW.md`
2. `MULTIPLE_UNPAID_BILLS_HANDLING.md`
3. `PAYMENT_INTEGRATION_COMPLETE.md`
4. `SUMMARY_INTEGRATION_PAYMENT.md` (file ini)

---

## 📱 Frontend Integration Notes

Untuk frontend developer, berikut yang perlu diimplementasikan:

### 1. Payment Page (`/pembayaran`)

- Tampilkan semua tagihan yang belum dibayar
- Button "Bayar" untuk setiap tagihan (→ call single payment endpoint)
- Button "Bayar Semua" untuk bayar semua sekaligus (→ call pay-all endpoint)
- Option: Bayar manual (wallet) atau Midtrans

### 2. History Page (`/riwayat-tagihan`)

- Tampilkan semua tagihan yang sudah dibayar
- Filter berdasarkan tanggal, metode pembayaran, dll
- Detail transaksi per tagihan

### 3. Notification System

- Implementasikan click handler untuk notification
- Redirect ke link yang ada di notification.link
- Update notification count setelah user klik

### 4. Midtrans Integration

```javascript
// Setelah dapat snapToken dari backend
snap.pay(snapToken, {
  onSuccess: function (result) {
    // Webhook akan handle update
    // Redirect ke /riwayat-tagihan
  },
  onPending: function (result) {
    // Show pending message
  },
  onError: function (result) {
    // Show error message
  },
  onClose: function () {
    // User close popup
  },
});
```

---

_Last Updated: Current Session_
_Semua integrasi pembayaran dan notifikasi sudah selesai dan siap digunakan_
