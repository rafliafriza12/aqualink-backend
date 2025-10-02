# 🏗️ Aqualink Backend - Architecture Documentation

**Last Updated:** October 3, 2025  
**Version:** 2.0

---

## 📑 Table of Contents

1. [System Overview](#system-overview)
2. [Controllers Structure](#controllers-structure)
3. [Payment System Architecture](#payment-system-architecture)
4. [Webhook System](#webhook-system)
5. [Notification System](#notification-system)
6. [Cron Jobs](#cron-jobs)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Best Practices](#best-practices)

---

## 🎯 System Overview

Aqualink Backend adalah sistem manajemen air berbasis IoT yang menangani:

- **Billing & Pembayaran** - Tagihan air bulanan dan pembayaran
- **Meteran IoT** - Monitor pemakaian air real-time
- **RAB Connection** - Rencana Anggaran Biaya pemasangan
- **Wallet Management** - E-wallet untuk user
- **Midtrans Integration** - Payment gateway
- **Notification System** - Push notification untuk user

---

## 🎮 Controllers Structure

### 1. **billingController.js**

**Purpose:** Mengelola tagihan air (billing) dan pembayaran billing

**Main Functions:**

- `generateMonthlyBilling()` - Generate billing untuk semua meteran (cron job)
- `generateBillingForMeter()` - Generate billing untuk satu meteran
- `payBilling()` - Pembayaran manual untuk satu tagihan
- `payAllBilling()` - Pembayaran manual untuk semua tagihan
- `createPayment()` - Buat Midtrans payment untuk satu tagihan
- `createPaymentForAllBills()` - Buat Midtrans payment untuk semua tagihan
- `updatePaymentStatus()` - Update status pembayaran (admin)
- `updateOverdueStatus()` - Check dan update tagihan yang overdue (cron job)

**Key Features:**

- ✅ Support single & multiple bill payment
- ✅ Midtrans integration untuk payment gateway
- ✅ Automatic denda calculation untuk late payment
- ✅ pemakaianBelumTerbayar tracking

**Routes:** `/api/billing/*`

---

### 2. **payment.js** (Wallet Top-up)

**Purpose:** Mengelola top-up saldo wallet menggunakan Midtrans

**Main Functions:**

- `createPayment()` - Buat Midtrans payment untuk top-up wallet
- `webhookMidtrans()` - Webhook untuk top-up wallet

**Key Features:**

- ✅ Wallet top-up via Midtrans
- ✅ Pending balance management
- ✅ Auto-confirm setelah payment success

**Routes:** `/api/midtrans/*`

**⚠️ IMPORTANT:** Fungsi `createPayment` di sini BERBEDA dengan di `billingController.js`

- **payment.js** → Top-up wallet
- **billingController.js** → Payment untuk billing

---

### 3. **paymentWebhookController.js** (Universal Webhook)

**Purpose:** Handle SEMUA webhook dari Midtrans untuk billing & RAB

**Main Functions:**

- `handlePaymentWebhook()` - Universal webhook handler

**Handles:**

- ✅ Single billing payment (`BILLING-{billingId}`)
- ✅ Multiple billing payment (`BILLING-MULTI-{userId}-{timestamp}`)
- ✅ RAB connection payment (`RAB-{rabId}`)

**Routes:** `/api/webhook/payment`

**⚠️ IMPORTANT:** Ini adalah SATU-SATUNYA webhook untuk billing & RAB

- Webhook untuk wallet top-up ada di `payment.js` (`/api/midtrans/notification`)
- Webhook ini sudah handle semua format order_id dengan routing otomatis

---

### 4. **rabConnectionController.js**

**Purpose:** Mengelola Rencana Anggaran Biaya (RAB) untuk pemasangan baru

**Main Functions:**

- `createRabConnection()` - Buat RAB baru
- `createPayment()` - Buat Midtrans payment untuk RAB
- `updateRabStatus()` - Update status RAB (admin)

**Routes:** `/api/rab-connection/*`

---

### 5. **meteranController.js**

**Purpose:** Mengelola data meteran air

**Key Features:**

- CRUD meteran
- Update pemakaian air dari IoT
- Track pemakaianBelumTerbayar

**Routes:** `/api/meteran/*`

---

### 6. **userController.js**

**Purpose:** Mengelola user authentication & profile

**Routes:** `/api/users/*`

---

### 7. **notificationController.js**

**Purpose:** Mengelola notifikasi untuk user

**Routes:** `/api/notification/*`

---

### 8. **historyUsageController.js**

**Purpose:** Menyimpan history pemakaian air dari IoT

**Key Features:**

- Simpan data usage dari IoT device
- Update `pemakaianBelumTerbayar` di meteran
- History tracking

---

## 💳 Payment System Architecture

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT SYSTEM                            │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
       ┌──────▼──────┐                ┌──────▼──────┐
       │   BILLING   │                │   WALLET    │
       │   PAYMENT   │                │   TOP-UP    │
       └──────┬──────┘                └──────┬──────┘
              │                               │
    ┌─────────┴─────────┐                   │
    │                   │                   │
┌───▼────┐        ┌─────▼─────┐       ┌────▼─────┐
│ MANUAL │        │ MIDTRANS  │       │ MIDTRANS │
│ PAYMENT│        │  PAYMENT  │       │ TOP-UP   │
└───┬────┘        └─────┬─────┘       └────┬─────┘
    │                   │                   │
    │             ┌─────┴─────┐             │
    │             │           │             │
    │      ┌──────▼───┐ ┌────▼──────┐     │
    │      │ SINGLE   │ │ MULTIPLE  │     │
    │      │ BILLING  │ │ BILLINGS  │     │
    │      └──────┬───┘ └────┬──────┘     │
    │             │           │             │
    │             └─────┬─────┘             │
    │                   │                   │
    └───────┬───────────┴───────────────────┘
            │
       ┌────▼─────┐
       │ WEBHOOK  │
       │ HANDLER  │
       └──────────┘
```

### Payment Methods

#### 1. Manual Payment (No Payment Gateway)

**Use Case:** User bayar langsung dengan cash atau sudah punya saldo

**Endpoints:**

- `PUT /api/billing/pay/:id` - Bayar satu tagihan
- `PUT /api/billing/pay-all` - Bayar semua tagihan

**Process:**

1. Verify billing exists & unpaid
2. Calculate denda if overdue
3. Update billing status to PAID
4. Decrement `pemakaianBelumTerbayar`
5. Send success notification

**No webhook needed** - langsung update database

---

#### 2. Midtrans Payment (Payment Gateway)

**Use Case:** User bayar dengan credit card, e-wallet, bank transfer via Midtrans

**A. Single Billing Payment**

- **Endpoint:** `POST /api/billing/create-payment/:id`
- **Order ID Format:** `BILLING-{billingId}`
- **Webhook:** `/api/webhook/payment`

**B. Multiple Billings Payment**

- **Endpoint:** `POST /api/billing/create-payment-all`
- **Order ID Format:** `BILLING-MULTI-{userId}-{timestamp}`
- **Webhook:** `/api/webhook/payment`

**C. Wallet Top-up**

- **Endpoint:** `POST /api/midtrans/payment/:id`
- **Order ID Format:** UUID (random)
- **Webhook:** `/api/midtrans/notification`

**D. RAB Payment**

- **Endpoint:** `POST /api/rab-connection/create-payment/:id`
- **Order ID Format:** `RAB-{rabId}`
- **Webhook:** `/api/webhook/payment`

**Process:**

1. Create Midtrans Snap transaction
2. Return Snap token & redirect URL
3. User pays on Midtrans page
4. Midtrans sends webhook notification
5. Webhook handler updates database
6. Send notification to user

---

## 🔗 Webhook System

### Webhook Architecture

```
Midtrans Server
     │
     │ POST notification
     │
     ▼
┌──────────────────────────────────────────┐
│  WEBHOOK ROUTER (/webhook/payment)       │
│  (paymentWebhookController.js)           │
└──────────────┬───────────────────────────┘
               │
       Check order_id prefix
               │
    ┌──────────┼──────────┬──────────┐
    │          │          │          │
BILLING-  BILLING-MULTI-  RAB-  (other)
    │          │          │          │
    ▼          ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐ ┌─────────┐
│ Single │ │Multi │ │   RAB   │ │ Wallet  │
│Billing │ │Bills │ │ Payment │ │ Top-up  │
└────────┘ └──────┘ └─────────┘ └─────────┘
                                      │
                                      └──> /midtrans/notification
```

### Webhook Endpoints

| Endpoint                 | Purpose                | Order ID Format                         | Controller                    |
| ------------------------ | ---------------------- | --------------------------------------- | ----------------------------- |
| `/webhook/payment`       | Billing & RAB payments | `BILLING-*`, `BILLING-MULTI-*`, `RAB-*` | `paymentWebhookController.js` |
| `/midtrans/notification` | Wallet top-up          | UUID                                    | `payment.js`                  |

### Webhook Flow

1. **Midtrans sends POST request** dengan payment status
2. **Signature verification** untuk keamanan
3. **Parse order_id** untuk determine payment type
4. **Route to appropriate handler** berdasarkan prefix
5. **Update database** (billing, transaction, meteran)
6. **Send notification** to user
7. **Return 200 OK** to Midtrans

### Transaction Status Mapping

| Midtrans Status | Action          | Description                    |
| --------------- | --------------- | ------------------------------ |
| `capture`       | Mark as PAID    | Payment captured (credit card) |
| `settlement`    | Mark as PAID    | Payment settled                |
| `pending`       | Keep as PENDING | Waiting for payment            |
| `deny`          | Mark as FAILED  | Payment denied                 |
| `cancel`        | Mark as FAILED  | User cancelled                 |
| `expire`        | Mark as FAILED  | Payment link expired           |

---

## 🔔 Notification System

### Notification Model

```javascript
{
  userId: ObjectId,      // User penerima notifikasi
  title: String,         // Judul notifikasi
  message: String,       // Isi pesan
  category: String,      // TRANSAKSI | INFORMASI | PERINGATAN
  link: String,          // Link tujuan saat notifikasi diklik
  isRead: Boolean,       // Status sudah dibaca atau belum
  createdAt: Date
}
```

### Notification Categories

| Category     | Use Case           | Link                              |
| ------------ | ------------------ | --------------------------------- |
| `TRANSAKSI`  | Pembayaran, top-up | `/riwayat-tagihan`, `/pembayaran` |
| `INFORMASI`  | Reminder, updates  | `/pembayaran`                     |
| `PERINGATAN` | Overdue, warnings  | `/pembayaran`                     |

### Notification Links Mapping

| Event               | Link               | Purpose                  |
| ------------------- | ------------------ | ------------------------ |
| New billing created | `/pembayaran`      | User bisa langsung bayar |
| Billing overdue     | `/pembayaran`      | Remind to pay            |
| Payment reminder    | `/pembayaran`      | Encourage early payment  |
| Payment success     | `/riwayat-tagihan` | View payment history     |
| Payment failed      | `/pembayaran`      | Retry payment            |
| Wallet topped up    | `/pembayaran`      | Ready to pay bills       |
| RAB approved        | `/koneksi-rab`     | Check RAB status         |
| RAB rejected        | `/koneksi-rab`     | View rejection reason    |

### Notification Creation Points

**In billingController.js:**

- Line 153: New billing generated
- Line 287: Manual payment success
- Line 523: Single billing paid
- Line 627: All billings paid
- Line 1008: RAB approved
- Line 1043: RAB rejected
- Line 1064: Survey approved
- Line 1149: Survey rejected

**In billingCron.js:**

- Line 143: New billing created (monthly cron)
- Line 201: Billing overdue (daily check)
- Line 273: Payment reminder (3 days before due)

**In paymentWebhookController.js:**

- Webhook success/failed notifications

---

## ⏰ Cron Jobs

### Billing Cron Jobs

```javascript
// File: utils/billingCron.js

// 1. Monthly Billing Generation
// Schedule: 1st day of month at 00:01
setupBillingCron();

// 2. Overdue Check
// Schedule: Daily at 00:05
setupOverdueCron();

// 3. Payment Reminder
// Schedule: Daily at 08:00
setupReminderCron();
```

### 1. Monthly Billing Generation

**Schedule:** 1st of every month at 00:01  
**Function:** `setupBillingCron()`

**Process:**

1. Get all active meters
2. Calculate pemakaian (current - last month)
3. Calculate biaya based on kelompok pelanggan
4. Create billing record
5. Send notification with `/pembayaran` link

**⚠️ IMPORTANT:**

- Does NOT increment `pemakaianBelumTerbayar`
- That field is updated real-time by IoT data

---

### 2. Overdue Check

**Schedule:** Daily at 00:05  
**Function:** `setupOverdueCron()`

**Process:**

1. Find all unpaid billings past due date
2. Mark as overdue
3. Send overdue notification

---

### 3. Payment Reminder

**Schedule:** Daily at 08:00  
**Function:** `setupReminderCron()`

**Process:**

1. Find billings due in 3 days
2. Check if reminder already sent today
3. Send reminder notification
4. Prevent duplicate reminders

---

## 📡 API Endpoints Reference

### Billing Endpoints

```
POST   /api/billing/generate-all              [Admin] Generate all billings
POST   /api/billing/generate/:meteranId       [Admin] Generate single billing
GET    /api/billing/all                       [Admin] Get all billings
GET    /api/billing/my                        [User] Get my billings
GET    /api/billing/:id                       [Auth] Get billing by ID
GET    /api/billing/unpaid                    [User] Get unpaid billings
PUT    /api/billing/pay/:id                   [User] Pay single bill (manual)
PUT    /api/billing/pay-all                   [User] Pay all bills (manual)
POST   /api/billing/create-payment/:id        [User] Create Midtrans payment (single)
POST   /api/billing/create-payment-all        [User] Create Midtrans payment (multiple)
PUT    /api/billing/status/:id                [Admin] Update payment status
PUT    /api/billing/update-overdue            [Admin] Update overdue status
GET    /api/billing/report/:periode           [Admin] Get monthly report
DELETE /api/billing/:id                       [Admin] Delete billing
```

### Wallet Endpoints

```
POST   /api/midtrans/payment/:id              [User] Create wallet top-up
POST   /api/midtrans/notification             [Public] Webhook for wallet top-up
```

### Webhook Endpoints

```
POST   /api/webhook/payment                   [Public] Universal webhook (billing & RAB)
POST   /api/midtrans/notification             [Public] Wallet top-up webhook
```

### RAB Endpoints

```
POST   /api/rab-connection                    [User] Create RAB
POST   /api/rab-connection/create-payment/:id [User] Create payment for RAB
GET    /api/rab-connection/my                 [User] Get my RAB connections
PUT    /api/rab-connection/status/:id         [Admin] Update RAB status
```

### Meteran Endpoints

```
GET    /api/meteran                           [Admin] Get all meteran
GET    /api/meteran/my                        [User] Get my meteran
POST   /api/meteran                           [Admin] Create meteran
PUT    /api/meteran/:id                       [Admin] Update meteran
DELETE /api/meteran/:id                       [Admin] Delete meteran
```

### Notification Endpoints

```
GET    /api/notification/my                   [User] Get my notifications
PUT    /api/notification/read/:id             [User] Mark as read
PUT    /api/notification/read-all             [User] Mark all as read
DELETE /api/notification/:id                  [User] Delete notification
```

---

## 🎯 Best Practices

### 1. Payment Method Selection

**Use Manual Payment (`payBilling`) When:**

- ✅ User sudah punya saldo cukup
- ✅ Pembayaran internal tanpa gateway
- ✅ Admin yang melakukan pembayaran untuk user
- ✅ Testing/development

**Use Midtrans Payment (`createPayment`) When:**

- ✅ User bayar dengan credit card/e-wallet/transfer
- ✅ User tidak punya saldo cukup
- ✅ Production environment dengan user real

---

### 2. pemakaianBelumTerbayar Management

**✅ DO:**

- Increment when IoT sends new usage data
- Decrement (not reset) when payment successful
- Use Math.max(0, ...) to prevent negative values

**❌ DON'T:**

- Don't increment in billing generation
- Don't reset to 0 on single payment (user might have multiple unpaid bills)
- Don't modify manually without reason

**Example:**

```javascript
// ✅ CORRECT: Decrement
meteran.pemakaianBelumTerbayar = Math.max(
  0,
  meteran.pemakaianBelumTerbayar - billing.totalPemakaian
);

// ❌ WRONG: Reset
meteran.pemakaianBelumTerbayar = 0;
```

---

### 3. Webhook Implementation

**✅ DO:**

- Always verify Midtrans signature
- Use appropriate order_id format
- Handle all transaction statuses
- Send notification with proper link
- Return 200 OK to Midtrans
- Log all webhook events

**❌ DON'T:**

- Don't create duplicate webhook endpoints
- Don't skip signature verification
- Don't return error for duplicate webhooks (Midtrans might retry)

---

### 4. Notification Best Practices

**✅ DO:**

- Always include link field
- Use descriptive title & message
- Set appropriate category
- Include amount in message with toLocaleString('id-ID')

**❌ DON'T:**

- Don't forget link field (user can't navigate)
- Don't use generic messages
- Don't include sensitive data

---

### 5. Error Handling

**✅ DO:**

- Use try-catch in all async functions
- Return proper HTTP status codes
- Log errors with context
- Send meaningful error messages

**❌ DON'T:**

- Don't expose internal errors to client
- Don't ignore errors
- Don't use generic 500 for all errors

---

### 6. Code Organization

**Current Structure (After Cleanup):**

```
controllers/
├── billingController.js       ✅ Billing & billing payment only
├── payment.js                 ✅ Wallet top-up only
├── paymentWebhookController.js ✅ Universal webhook (billing & RAB)
├── rabConnectionController.js ✅ RAB management
├── meteranController.js       ✅ Meteran CRUD
├── userController.js          ✅ User auth & profile
└── notificationController.js  ✅ Notifications
```

**⚠️ REMOVED (Duplicates):**

- ❌ `midtransWebhook` from `billingController.js` (moved to paymentWebhookController)
- ❌ `handleMultipleBillingWebhook` from `billingController.js` (moved to paymentWebhookController)
- ❌ `/api/billing/webhook` route (use `/api/webhook/payment` instead)

---

## 🔒 Security Considerations

### 1. Webhook Security

- Always verify Midtrans signature
- Use HTTPS in production
- Don't expose webhook URLs publicly
- Log all webhook attempts

### 2. Authentication

- Use JWT tokens
- Verify user ownership of resources
- Implement role-based access (user, admin, technician)

### 3. Data Validation

- Validate all input data
- Sanitize user inputs
- Use Mongoose schema validation
- Prevent SQL/NoSQL injection

---

## 📊 Database Models

### Key Models

1. **Billing** - Tagihan air bulanan
2. **Meteran** - Meteran air IoT
3. **User** - Data user/pelanggan
4. **Transaction** - Record transaksi pembayaran
5. **Notification** - Notifikasi untuk user
6. **Wallet** - E-wallet user
7. **RabConnection** - RAB pemasangan baru
8. **HistoryUsage** - History pemakaian air dari IoT
9. **KelompokPelanggan** - Kelompok tarif pelanggan

---

## 🚀 Deployment Checklist

### Environment Variables Required

```env
# MongoDB
MONGO_URI=mongodb://...

# Midtrans
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...

# Frontend URL (for callbacks)
FRONTEND_URL=https://your-frontend.com

# JWT Secret
JWT_SECRET=...

# Port
PORT=5000
```

### Production Setup

1. ✅ Set environment variables
2. ✅ Enable HTTPS
3. ✅ Configure CORS properly
4. ✅ Set up cron jobs
5. ✅ Configure Midtrans webhook URLs
6. ✅ Test payment flow end-to-end
7. ✅ Monitor webhook logs
8. ✅ Set up error tracking (Sentry, etc.)

---

## 📚 Related Documentation

- [PEMAKAIAN_BELUM_TERBAYAR_FLOW.md](./PEMAKAIAN_BELUM_TERBAYAR_FLOW.md)
- [MULTIPLE_UNPAID_BILLS_HANDLING.md](./MULTIPLE_UNPAID_BILLS_HANDLING.md)
- [PAYMENT_INTEGRATION_COMPLETE.md](./PAYMENT_INTEGRATION_COMPLETE.md)
- [SUMMARY_INTEGRATION_PAYMENT.md](./SUMMARY_INTEGRATION_PAYMENT.md)
- [MIDTRANS_INTEGRATION_GUIDE.md](./MIDTRANS_INTEGRATION_GUIDE.md)

---

## 🆘 Troubleshooting

### Common Issues

**1. Webhook not received**

- Check Midtrans webhook URL configuration
- Verify signature verification code
- Check server logs
- Test with Midtrans simulator

**2. Payment status not updated**

- Check webhook handler logs
- Verify order_id format
- Check database connection
- Review transaction status mapping

**3. Duplicate notifications**

- Check for multiple webhook endpoints
- Verify idempotency handling
- Review cron job schedule

**4. pemakaianBelumTerbayar incorrect**

- Verify IoT data is being received
- Check increment/decrement logic
- Review payment flow
- Check for manual modifications

---

_Documentation maintained by: Development Team_  
_For questions or updates, please create an issue in the repository._
