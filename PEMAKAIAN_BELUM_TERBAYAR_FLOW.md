# 📊 Flow `pemakaianBelumTerbayar` - Dokumentasi

## 🎯 **Konsep Dasar**

`pemakaianBelumTerbayar` adalah field di model `Meteran` yang melacak **total pemakaian air yang belum dibayar oleh user** secara real-time.

---

## ✅ **Flow yang BENAR**

### **1. IoT Device Mengirim Data Pemakaian (Real-time Increment)**

**File:** `controllers/historyUsageController.js` line 77

```javascript
// Update total pemakaian di meteran (akumulasi)
meteran.totalPemakaian += usedWater;
meteran.pemakaianBelumTerbayar += usedWater; // ✅ INCREMENT setiap ada usage baru
await meteran.save();
```

**Contoh:**

```
IoT kirim 5 m³  → pemakaianBelumTerbayar = 5
IoT kirim 3 m³  → pemakaianBelumTerbayar = 8
IoT kirim 2 m³  → pemakaianBelumTerbayar = 10
```

---

### **2. Cron/Admin Membuat Billing (Tidak Mengubah pemakaianBelumTerbayar)**

**File:** `utils/billingCron.js` & `controllers/billingController.js`

```javascript
// Update meteran jatuhTempo only
// Note: Do NOT increment pemakaianBelumTerbayar here!
// pemakaianBelumTerbayar is already tracked in real-time by historyUsageController
meteran.jatuhTempo = getDueDate();
await meteran.save();
```

**Penting:** ❌ **JANGAN** tambahkan `meteran.pemakaianBelumTerbayar += totalPemakaian`

- Karena `pemakaianBelumTerbayar` sudah di-increment di step 1
- Jika ditambahkan lagi = **DOUBLE COUNTING!**

**Contoh:**

```
Bulan 1:
- IoT kirim total 10 m³ → pemakaianBelumTerbayar = 10 ✅
- Cron buat billing 10 m³ → pemakaianBelumTerbayar tetap 10 ✅ (TIDAK BERUBAH!)
```

---

### **3. User Membayar via Webhook/Manual (Reset ke 0)**

**File:**

- `controllers/paymentWebhookController.js` line 263
- `controllers/billingController.js` line 510

```javascript
// Reset meteran pemakaianBelumTerbayar jika pembayaran berhasil
const meteran = await Meteran.findById(billing.meteranId);
meteran.pemakaianBelumTerbayar = 0; // ✅ RESET ke 0
await meteran.save();
```

**Contoh:**

```
Bulan 1:
- IoT kirim total 10 m³ → pemakaianBelumTerbayar = 10
- Cron buat billing 10 m³ → pemakaianBelumTerbayar tetap 10
- User bayar → pemakaianBelumTerbayar = 0 ✅

Bulan 2:
- IoT kirim total 15 m³ → pemakaianBelumTerbayar = 15
- Cron buat billing 15 m³ → pemakaianBelumTerbayar tetap 15
- User TIDAK bayar → pemakaianBelumTerbayar tetap 15

Bulan 3:
- IoT kirim 12 m³ lagi → pemakaianBelumTerbayar = 27 (15 + 12)
- Cron buat billing 12 m³ → pemakaianBelumTerbayar tetap 27
- User bayar semua → pemakaianBelumTerbayar = 0 ✅
```

---

### **4. Admin Mengubah Status Pembayaran**

**File:** `controllers/billingController.js` line 878-883

```javascript
if (isPaid && !wasPaid) {
  // Payment successful: reset pemakaianBelumTerbayar to 0
  meteran.pemakaianBelumTerbayar = 0;
} else if (!isPaid && wasPaid) {
  // Payment cancelled: restore pemakaianBelumTerbayar
  meteran.pemakaianBelumTerbayar += billing.totalPemakaian;
}
```

**Contoh:**

```
- User bayar → pemakaianBelumTerbayar = 0
- Admin batalkan pembayaran → pemakaianBelumTerbayar = 10 (restored)
- Admin bayar lagi → pemakaianBelumTerbayar = 0
```

---

### **5. Admin Menghapus Billing**

**File:** `controllers/billingController.js` line 1030-1034

```javascript
// Note: We don't need to adjust meteran.pemakaianBelumTerbayar when deleting billing
// because pemakaianBelumTerbayar is tracked in real-time by historyUsageController
// It's not affected by billing creation or deletion
```

**Penting:** ❌ **JANGAN** kurangi `pemakaianBelumTerbayar` saat delete billing

- Karena billing creation tidak menambahkan `pemakaianBelumTerbayar`
- Jadi billing deletion juga tidak boleh menguranginya

---

## ❌ **Kesalahan yang HARUS DIHINDARI**

### **1. Double Counting saat Buat Billing**

```javascript
// ❌ SALAH - JANGAN LAKUKAN INI!
meteran.pemakaianBelumTerbayar += totalPemakaian; // DOUBLE COUNTING!
```

### **2. Mengurangi saat Delete Billing**

```javascript
// ❌ SALAH - JANGAN LAKUKAN INI!
meteran.pemakaianBelumTerbayar -= billing.totalPemakaian;
```

### **3. Menggunakan pemakaianBelumTerbayar untuk Hitung Billing**

```javascript
// ❌ SALAH - JANGAN LAKUKAN INI!
const totalPemakaian = meteran.pemakaianBelumTerbayar;
```

**Kenapa salah?**

- Jika user punya 2 billing yang belum dibayar:
  - Billing 1: 10 m³
  - Billing 2: 15 m³
  - `pemakaianBelumTerbayar` = 25 m³ (total semua yang belum dibayar)
- Jika kita buat Billing 3 berdasarkan `pemakaianBelumTerbayar`, akan tagih 25 m³ lagi (SALAH!)
- Yang benar: hitung dari selisih `totalPemakaian` bulan ini vs bulan lalu

---

## 📋 **Checklist Implementasi**

✅ **historyUsageController.js**

- [x] Increment `pemakaianBelumTerbayar` setiap ada usage baru

✅ **billingCron.js & billingController.js (Create Billing)**

- [x] JANGAN increment `pemakaianBelumTerbayar`
- [x] Hitung `totalPemakaian` dari selisih `pemakaianAkhir - pemakaianAwal`
- [x] Update `jatuhTempo` saja

✅ **billingController.js & paymentWebhookController.js (Payment Success)**

- [x] Reset `pemakaianBelumTerbayar = 0`

✅ **billingController.js (Update Billing Status)**

- [x] Reset ke 0 jika bayar
- [x] Restore `+= totalPemakaian` jika cancel pembayaran

✅ **billingController.js (Delete Billing)**

- [x] JANGAN ubah `pemakaianBelumTerbayar`

---

## 🧪 **Testing Scenario**

### **Scenario 1: Normal Flow**

```
1. IoT kirim 10 m³ → pemakaianBelumTerbayar = 10 ✅
2. Cron buat billing → pemakaianBelumTerbayar = 10 ✅
3. User bayar → pemakaianBelumTerbayar = 0 ✅
```

### **Scenario 2: User Tidak Bayar (Akumulasi)**

```
1. IoT kirim 10 m³ → pemakaianBelumTerbayar = 10
2. Cron buat billing bulan 1 → pemakaianBelumTerbayar = 10
3. User TIDAK bayar
4. IoT kirim 15 m³ lagi → pemakaianBelumTerbayar = 25
5. Cron buat billing bulan 2 → pemakaianBelumTerbayar = 25
6. User bayar semua → pemakaianBelumTerbayar = 0 ✅
```

### **Scenario 3: Admin Batalkan Pembayaran**

```
1. IoT kirim 10 m³ → pemakaianBelumTerbayar = 10
2. Cron buat billing → pemakaianBelumTerbayar = 10
3. User bayar → pemakaianBelumTerbayar = 0
4. Admin batalkan → pemakaianBelumTerbayar = 10 ✅
```

### **Scenario 4: Admin Hapus Billing**

```
1. IoT kirim 10 m³ → pemakaianBelumTerbayar = 10
2. Cron buat billing → pemakaianBelumTerbayar = 10
3. Admin hapus billing → pemakaianBelumTerbayar = 10 ✅ (tetap!)
```

---

## 📊 **Diagram Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    IoT Device Kirim Data                     │
│                                                              │
│  meteran.totalPemakaian += usedWater                        │
│  meteran.pemakaianBelumTerbayar += usedWater ← INCREMENT!   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Cron/Admin Buat Billing (Bulan Ke-N)           │
│                                                              │
│  totalPemakaian = meteran.totalPemakaian - pemakaianAwal    │
│  billing.save()                                             │
│  meteran.jatuhTempo = getDueDate()                          │
│  ❌ JANGAN: meteran.pemakaianBelumTerbayar +=               │
└──────────────────────────┬───────────────────────────────────┘
                           │
                   ┌───────┴────────┐
                   │                │
                   ▼                ▼
         ┌──────────────┐  ┌──────────────┐
         │  User Bayar  │  │ User TIDAK   │
         │              │  │    Bayar     │
         │ pemakaian    │  │ pemakaian    │
         │ BelumTerbayar│  │ BelumTerbayar│
         │     = 0      │  │ tetap sama   │
         │   ← RESET!   │  │ (akumulasi)  │
         └──────────────┘  └──────┬───────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │ Bulan Depan  │
                          │ pemakaian    │
                          │ bertambah    │
                          │ terus        │
                          └──────────────┘
```

---

## 🔍 **Monitoring & Debugging**

### **Query untuk Cek Konsistensi Data**

```javascript
// Cek meteran dengan pemakaianBelumTerbayar > 0
const meterans = await Meteran.find({
  pemakaianBelumTerbayar: { $gt: 0 },
}).populate("userId", "fullName email");

for (const meteran of meterans) {
  // Cek apakah ada billing yang belum dibayar
  const unpaidBillings = await Billing.find({
    meteranId: meteran._id,
    isPaid: false,
  });

  console.log({
    noMeteran: meteran.noMeteran,
    pemakaianBelumTerbayar: meteran.pemakaianBelumTerbayar,
    unpaidBillingsCount: unpaidBillings.length,
    totalUnpaidPemakaian: unpaidBillings.reduce(
      (sum, b) => sum + b.totalPemakaian,
      0
    ),
  });
}
```

### **Expected Output**

- `pemakaianBelumTerbayar` HARUS >= `totalUnpaidPemakaian`
- Selisihnya adalah usage baru yang belum di-bill

---

## 📝 **Catatan Penting**

1. **`pemakaianBelumTerbayar` adalah Real-time Counter**

   - Di-update setiap kali IoT kirim data
   - Bukan dihitung dari billing

2. **Billing adalah Snapshot Periode**

   - Billing mencatat pemakaian untuk periode tertentu
   - Tidak mempengaruhi `pemakaianBelumTerbayar`

3. **Payment adalah Trigger Reset**

   - Hanya payment yang me-reset `pemakaianBelumTerbayar`
   - Tidak peduli berapa banyak billing yang dibayar

4. **Akumulasi Otomatis**
   - Jika user tidak bayar beberapa bulan, `pemakaianBelumTerbayar` akan terus bertambah
   - Sekali bayar = reset semua ke 0

---

**Terakhir diupdate:** 2 Oktober 2025
**Status:** ✅ Sudah diperbaiki dan siap production
