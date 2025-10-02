# 💳 Midtrans Payment Integration Guide

## 📋 Overview

This guide explains the complete Midtrans payment gateway integration for the Aqualink billing system. Users can now pay their water bills online using various payment methods through Midtrans Snap.

---

## ✅ What's Been Implemented

### 1. Backend Integration

- ✅ `createPayment` function in `billingController.js` - Generates Midtrans payment link
- ✅ `midtransWebhook` function in `billingController.js` - Handles payment status updates
- ✅ Signature verification using SHA512 hash for security
- ✅ Automatic billing update when payment is successful
- ✅ **Automatic reset of `meteran.pemakaianBelumTerbayar = 0`** when paid
- ✅ Transaction model integration for tracking payments
- ✅ Notification system for payment status updates

### 2. API Endpoints

- ✅ `POST /billing/:id/create-payment` - User creates payment link (Protected)
- ✅ `POST /billing/webhook` - Midtrans sends payment status (Public, no auth)
- ✅ `PUT /billing/:id/pay` - Manual payment option (Protected)

### 3. Routes Configuration

- ✅ Added Midtrans endpoints to `billingRoutes.js`
- ✅ Webhook endpoint placed before auth middleware (public access)
- ✅ User payment endpoints protected with `verifyToken`

### 4. Documentation

- ✅ `END_TO_END_WORKFLOW.md` - Complete workflow from registration to payment
- ✅ `BILLING_DOCUMENTATION.md` - Updated with Midtrans integration section
- ✅ `API_DOCUMENTATION_V2.md` - Added Midtrans API endpoints
- ✅ `MIDTRANS_INTEGRATION_GUIDE.md` - This file

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Midtrans Sandbox (for testing)
MIDTRANS_SERVER_KEY=SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-
MIDTRANS_CLIENT_KEY=SB-Mid-client-63GqcLJxWhrc5D0A
MIDTRANS_IS_PRODUCTION=false

# Midtrans Production (when ready)
# MIDTRANS_SERVER_KEY=Mid-server-YOUR-PRODUCTION-KEY
# MIDTRANS_CLIENT_KEY=Mid-client-YOUR-PRODUCTION-KEY
# MIDTRANS_IS_PRODUCTION=true

# Frontend URL (for payment redirect)
FRONTEND_URL=http://localhost:3000
```

### Midtrans Configuration

Your Midtrans client is already configured in `middleware/midtrans.js`:

```javascript
const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = snap;
```

---

## 📊 Payment Flow

### Step-by-Step Process

```
┌────────────────────────────────────────────────────────────┐
│  1. User views unpaid billing                              │
│     GET /billing/unpaid                                    │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  2. User clicks "Pay with Midtrans"                        │
│     POST /billing/:id/create-payment                       │
│     → Backend creates Snap token                           │
│     → Returns: token, redirectUrl, orderId                 │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  3. Frontend opens Midtrans Snap popup                     │
│     snap.pay(token, callbacks)                             │
│     → User selects payment method                          │
│     → User completes payment                               │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  4. Midtrans sends webhook notification                    │
│     POST /billing/webhook                                  │
│     → Backend verifies signature                           │
│     → Backend checks transaction_status                    │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  5. If payment successful:                                 │
│     → Update billing.isPaid = true                         │
│     → Update billing.paidAt = now                          │
│     → Update billing.paymentMethod = "MIDTRANS"            │
│     → RESET meteran.pemakaianBelumTerbayar = 0            │
│     → Update transaction.status = "success"                │
│     → Send notification to user                            │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  6. Frontend receives success callback                     │
│     onSuccess(result) → Show success message               │
│     User sees updated billing status                       │
└────────────────────────────────────────────────────────────┘
```

---

## 💻 Frontend Integration

### Step 1: Include Midtrans Snap Script

Add this to your HTML `<head>`:

```html
<!-- Sandbox -->
<script
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="SB-Mid-client-63GqcLJxWhrc5D0A"
></script>

<!-- Production (when ready) -->
<!-- <script src="https://app.midtrans.com/snap/snap.js" 
        data-client-key="YOUR-PRODUCTION-CLIENT-KEY"></script> -->
```

### Step 2: Create Payment Function

```javascript
async function payWithMidtrans(billingId) {
  try {
    // Show loading
    showLoading("Creating payment link...");

    // Call your API to create payment
    const response = await fetch(`/billing/${billingId}/create-payment`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("userToken"),
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status === 201) {
      // Hide loading
      hideLoading();

      // Open Midtrans Snap popup
      snap.pay(data.data.token, {
        onSuccess: function (result) {
          console.log("Payment success:", result);

          // Show success message
          Swal.fire({
            icon: "success",
            title: "Pembayaran Berhasil!",
            text: "Tagihan Anda telah dibayar. Terima kasih.",
            confirmButtonText: "OK",
          }).then(() => {
            // Refresh billing list
            window.location.reload();
          });
        },

        onPending: function (result) {
          console.log("Payment pending:", result);

          // Show pending message
          Swal.fire({
            icon: "info",
            title: "Pembayaran Sedang Diproses",
            text: "Silakan selesaikan pembayaran Anda.",
            confirmButtonText: "OK",
          });
        },

        onError: function (result) {
          console.log("Payment error:", result);

          // Show error message
          Swal.fire({
            icon: "error",
            title: "Pembayaran Gagal",
            text: "Terjadi kesalahan. Silakan coba lagi.",
            confirmButtonText: "OK",
          });
        },

        onClose: function () {
          console.log("Payment popup closed");

          // User closed popup without completing payment
          // You can optionally show a message here
        },
      });
    } else {
      hideLoading();

      // Show error
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Gagal membuat payment link",
        confirmButtonText: "OK",
      });
    }
  } catch (error) {
    hideLoading();
    console.error("Error:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Terjadi kesalahan sistem. Silakan coba lagi.",
      confirmButtonText: "OK",
    });
  }
}
```

### Step 3: Add Payment Button to Your Billing Page

```html
<div class="billing-card">
  <h3>Tagihan Periode: 2024-01</h3>
  <p>Total: Rp 110,670</p>
  <p>Status: <span class="badge badge-danger">Belum Dibayar</span></p>
  <p>Jatuh Tempo: 25 Februari 2024</p>
  <p>Denda: Rp 2,170</p>

  <button
    class="btn btn-primary"
    onclick="payWithMidtrans('673fkl890abcdef123456789')"
  >
    💳 Bayar dengan Midtrans
  </button>
</div>
```

### React/Vue Example

```javascript
import React, { useState } from "react";

function BillingCard({ billing }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/billing/${billing._id}/create-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.status === 201) {
        setLoading(false);

        // Open Midtrans Snap
        window.snap.pay(data.data.token, {
          onSuccess: (result) => {
            alert("Pembayaran berhasil!");
            window.location.reload();
          },
          onPending: (result) => {
            alert("Pembayaran sedang diproses");
          },
          onError: (result) => {
            alert("Pembayaran gagal");
          },
        });
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="billing-card">
      <h3>Periode: {billing.periode}</h3>
      <p>Total: Rp {billing.totalTagihan.toLocaleString("id-ID")}</p>
      <p>Denda: Rp {billing.denda.toLocaleString("id-ID")}</p>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Processing..." : "💳 Bayar dengan Midtrans"}
      </button>
    </div>
  );
}

export default BillingCard;
```

---

## 🧪 Testing Guide

### 1. Local Testing Setup

#### Using ngrok (Recommended)

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# In another terminal, start ngrok
ngrok http 3000

# You'll get a URL like:
# https://abc123.ngrok.io
```

#### Configure Webhook in Midtrans

1. Login to [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com)
2. Go to **Settings** → **Configuration**
3. Set **Payment Notification URL**:
   ```
   https://abc123.ngrok.io/billing/webhook
   ```
4. Click **Update**

### 2. Test Payment Flow

#### Step 1: Create Test Billing

```bash
# Login as admin and generate billing
curl -X POST http://localhost:3000/billing/generate-all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Step 2: Get Unpaid Billing

```bash
# Login as user
curl -X GET http://localhost:3000/billing/unpaid \
  -H "Authorization: Bearer USER_TOKEN"
```

#### Step 3: Create Payment

```bash
curl -X POST http://localhost:3000/billing/BILLING_ID/create-payment \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"
```

You'll get a response like:

```json
{
  "status": 201,
  "data": {
    "token": "66e4fa55-fdac-4ef9-91b5-733b5d859229",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
  }
}
```

#### Step 4: Complete Payment

Open the `redirectUrl` in your browser and complete payment using test credentials:

**Credit Card:**

```
Card Number: 4811 1111 1111 1114
CVV: 123
Exp: 01/25
3D Secure OTP: 112233
```

**GoPay:**

- Use GoPay Simulator
- OTP: 112233

**Bank Transfer:**

- Get virtual account number
- Use Midtrans simulator to mark as paid

#### Step 5: Verify Payment

Check your server console for webhook logs:

```
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'settlement' }
✅ Payment settled: BILL-673fkl890abcdef123456789-1705987200000
```

Check billing status:

```bash
curl -X GET http://localhost:3000/billing/BILLING_ID \
  -H "Authorization: Bearer USER_TOKEN"
```

Verify response shows:

```json
{
  "isPaid": true,
  "paidAt": "2024-01-25T14:30:15.000Z",
  "paymentMethod": "MIDTRANS"
}
```

Check meteran reset:

```bash
curl -X GET http://localhost:3000/meteran/USER_ID/meteran \
  -H "Authorization: Bearer USER_TOKEN"
```

Verify response shows:

```json
{
  "pemakaianBelumTerbayar": 0
}
```

### 3. Manual Webhook Testing

You can manually trigger the webhook for testing:

```bash
# Generate signature
node -e "
const crypto = require('crypto');
const order_id = 'BILL-673fkl890abcdef123456789-1705987200000';
const status_code = '200';
const gross_amount = '110670.00';
const serverKey = 'SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-';
const signature = crypto
  .createHash('sha512')
  .update(order_id + status_code + gross_amount + serverKey)
  .digest('hex');
console.log('Signature:', signature);
"

# Send webhook
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
    "fraud_status": "accept",
    "payment_type": "bank_transfer"
  }'
```

---

## 🚀 Production Deployment

### 1. Get Production Credentials

1. Complete [Midtrans merchant registration](https://midtrans.com)
2. Submit required documents
3. Wait for approval (usually 1-3 business days)
4. Get production credentials from dashboard

### 2. Update Environment Variables

```bash
# Production credentials
MIDTRANS_SERVER_KEY=Mid-server-YOUR-PRODUCTION-KEY
MIDTRANS_CLIENT_KEY=Mid-client-YOUR-PRODUCTION-KEY
MIDTRANS_IS_PRODUCTION=true
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Configure Production Webhook

1. Login to [Midtrans Production Dashboard](https://dashboard.midtrans.com)
2. Go to **Settings** → **Configuration**
3. Set **Payment Notification URL**:
   ```
   https://your-api-domain.com/billing/webhook
   ```
4. Enable **HTTP Notification**
5. Set **Finish/Unfinish/Error Redirect URL** (optional):
   ```
   Finish: https://your-frontend.com/payment/success
   Unfinish: https://your-frontend.com/payment/pending
   Error: https://your-frontend.com/payment/error
   ```

### 4. Update Frontend Script

Change from sandbox to production:

```html
<!-- Production -->
<script
  src="https://app.midtrans.com/snap/snap.js"
  data-client-key="YOUR-PRODUCTION-CLIENT-KEY"
></script>
```

### 5. Security Checklist

- ✅ Use HTTPS for webhook URL (required in production)
- ✅ Store server key in environment variables (never in code)
- ✅ Verify signature on every webhook call
- ✅ Implement rate limiting on webhook endpoint
- ✅ Log all webhook calls for audit trail
- ✅ Set up monitoring and alerts for webhook failures
- ✅ Handle webhook retries (Midtrans retries failed webhooks)
- ✅ Test all payment methods before going live

### 6. Payment Methods Configuration

In Midtrans dashboard, enable/disable payment methods:

- Credit/Debit Card (Visa, MasterCard, JCB)
- Bank Transfer (BCA, Mandiri, BNI, Permata, BRI)
- E-Wallet (GoPay, ShopeePay, QRIS)
- Convenience Store (Indomaret, Alfamart)
- Direct Debit (BCA KlikPay, CIMB Clicks)

---

## 🔍 Monitoring & Debugging

### Console Logs

Your server will log webhook events:

```bash
# Payment initiated
📝 Creating Midtrans payment for billing: 673fkl890abcdef123456789
💰 Total amount: Rp 110,670 (including denda)
✅ Payment link created: BILL-673fkl890abcdef123456789-1705987200000

# Webhook received
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'settlement', ... }
🔒 Signature verified
✅ Payment settled: BILL-673fkl890abcdef123456789-1705987200000
📝 Billing updated: isPaid=true
🔄 Meteran reset: pemakaianBelumTerbayar=0
📧 Notification sent to user

# Payment failed
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'cancel', ... }
❌ Payment failed: BILL-673fkl890abcdef123456789-1705987200000
📧 Notification sent to user
```

### Midtrans Dashboard

Monitor your transactions:

1. Login to dashboard
2. Go to **Transactions**
3. Filter by date, status, payment method
4. View webhook delivery logs
5. Retry failed webhooks manually

### Database Queries

```javascript
// Find pending transactions
db.transactions.find({ status: "pending" }).sort({ createdAt: -1 });

// Find failed transactions
db.transactions.find({ status: "failed" }).sort({ createdAt: -1 });

// Find unpaid billing with denda
db.billings
  .find({
    isPaid: false,
    dueDate: { $lt: new Date() },
  })
  .sort({ dueDate: 1 });

// Check meters with unpaid usage
db.meterans.find({
  pemakaianBelumTerbayar: { $gt: 0 },
});
```

---

## ❓ Troubleshooting

### Issue: Webhook Not Received

**Symptoms:** Payment success but billing not updated

**Solutions:**

1. Check Midtrans dashboard for webhook delivery logs
2. Ensure webhook URL is publicly accessible (use ngrok for local)
3. Verify HTTPS is used in production
4. Check server logs for errors
5. Verify firewall allows incoming requests
6. Test webhook manually with cURL

### Issue: Invalid Signature

**Symptoms:** Webhook returns 403 Forbidden

**Solutions:**

1. Verify server key is correct in `.env`
2. Check signature calculation matches Midtrans format
3. Ensure `gross_amount` format is correct (string with 2 decimals)
4. Verify no extra spaces in environment variables

### Issue: Meteran Not Reset

**Symptoms:** `pemakaianBelumTerbayar` still has value after payment

**Solutions:**

1. Check webhook was processed successfully (console logs)
2. Verify transaction status is "settlement" or "capture"
3. Check `billing.isPaid` is true
4. Ensure meteran document is properly populated
5. Check for errors in webhook handler

### Issue: Payment Pending Forever

**Symptoms:** Transaction stuck in "pending" status

**Solutions:**

1. Check if user completed payment on Midtrans page
2. Payment may have expired (24 hours limit)
3. Check Midtrans dashboard for transaction status
4. User can create a new payment link

### Issue: Duplicate Webhook Calls

**Symptoms:** Multiple webhook calls for same transaction

**Solutions:**

1. This is normal - Midtrans retries failed webhooks
2. Make webhook handler idempotent (safe to call multiple times)
3. Check `billing.isPaid` before updating
4. Always return 200 OK if transaction already processed

---

## 📚 Additional Resources

### Documentation

- [Midtrans Snap Documentation](https://docs.midtrans.com/en/snap/overview)
- [Webhook Notification](https://docs.midtrans.com/en/after-payment/http-notification)
- [Sandbox Testing](https://docs.midtrans.com/en/technical-reference/sandbox-test)

### Support

- Midtrans Support: support@midtrans.com
- Midtrans Slack: [Join](https://midtrans.com/slack)
- Documentation: https://docs.midtrans.com

### Related Files

- `END_TO_END_WORKFLOW.md` - Complete system workflow
- `BILLING_DOCUMENTATION.md` - Billing system details
- `API_DOCUMENTATION_V2.md` - Complete API reference
- `controllers/billingController.js` - Payment logic
- `routes/billingRoutes.js` - API routes
- `middleware/midtrans.js` - Midtrans configuration

---

## ✅ Integration Checklist

### Backend

- [x] `createPayment` function implemented
- [x] `midtransWebhook` function implemented
- [x] Signature verification added
- [x] Billing update logic added
- [x] Meteran reset logic added
- [x] Transaction model integration
- [x] Notification system integration
- [x] Routes configured correctly

### Frontend

- [ ] Midtrans Snap script included
- [ ] Payment button added to billing page
- [ ] Payment function implemented
- [ ] Success/error callbacks handled
- [ ] Loading states added
- [ ] Error messages displayed

### Configuration

- [x] Environment variables set
- [ ] Webhook URL configured in Midtrans
- [ ] ngrok running for local testing
- [ ] Production credentials obtained (when ready)

### Testing

- [ ] Create test billing
- [ ] Create payment link
- [ ] Complete payment with test card
- [ ] Verify webhook received
- [ ] Verify billing updated
- [ ] Verify meteran reset
- [ ] Test all payment methods

### Production

- [ ] Production credentials obtained
- [ ] Webhook URL configured (HTTPS)
- [ ] Frontend script updated
- [ ] Security checklist completed
- [ ] Monitoring set up
- [ ] All payment methods tested

---

## 🎉 Summary

✅ **Midtrans integration is complete!**

Users can now:

1. View unpaid billing with automatic denda calculation
2. Click "Pay with Midtrans" button
3. Choose from multiple payment methods
4. Complete payment on Midtrans page
5. Receive instant confirmation
6. See billing marked as paid
7. **See their `pemakaianBelumTerbayar` automatically reset to 0**

The webhook automatically handles all payment status updates, so you don't need to manually check payment status. Everything is automated! 🚀

---

_Last Updated: January 25, 2024_
_Version: 1.0_
_Author: Aqualink Development Team_
