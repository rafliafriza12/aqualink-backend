# Fitur Kondisional Nomor HP dan Status Upload Data Aktivasi

## 📋 Overview

Dokumen ini menjelaskan implementasi kondisional untuk menangani kasus di mana:

1. User sudah mengupload data aktivasi koneksi air
2. User belum memasukkan nomor HP (misalnya login via Google OAuth)

## 🎯 Tujuan

Memberikan peringatan kepada user untuk melengkapi nomor HP jika sudah mengupload data aktivasi koneksi, karena nomor HP diperlukan untuk:

- Proses verifikasi oleh admin/teknisi
- Pembayaran via Midtrans (customer_details)
- Notifikasi dan komunikasi

## ✅ Fitur yang Sudah Ada

### 1. **Kondisional Status Connection Data** ✅

Location: `aqualink-frontpage/app/(pages)/(private)/profile/page.tsx`

```tsx
{
  !hasConnectionData ? (
    // Tampilkan tombol "Aktivasi Koneksi Air"
    <Link href="/profile/connection-data">Aktivasi Koneksi Air</Link>
  ) : !isVerified ? (
    // Tampilkan "Menunggu Verifikasi" + tombol bayar RAB
    <div>Menunggu Verifikasi...</div>
  ) : (
    // Tampilkan status koneksi IoT
    <div>Status Koneksi IoT</div>
  );
}
```

**Status:**

- ✅ Kondisi 1: Belum upload data → Tampilkan tombol "Aktivasi Koneksi Air"
- ✅ Kondisi 2: Sudah upload tapi belum verified → Tampilkan status "Menunggu Verifikasi" + pembayaran RAB
- ✅ Kondisi 3: Sudah verified → Tampilkan status koneksi IoT
- ✅ Kondisi 4: Sudah punya meteran → Tampilkan menu "Riwayat Pemakaian"

### 2. **Backend Support** ✅

Location: `aqualink-backend/controllers/userController.js`

```javascript
// getUserProfile endpoint
return res.status(200).json({
  status: 200,
  data: {
    user,
    hasConnectionData: !!user.SambunganDataId,
    hasMeteran: !!user.meteranId,
    isVerified: user.isVerified,
  },
  message: "Profil berhasil diambil",
});
```

## 🆕 Fitur Baru: Peringatan Nomor HP

### 1. **Warning Component di Profile Page**

Location: `aqualink-frontpage/app/(pages)/(private)/profile/page.tsx`

```tsx
{
  /* Warning: No Phone Number & Has Connection Data */
}
{
  !hasPhone && hasConnectionData && (
    <div className="w-full rounded-[24px] bg-[#FF4444]/20 border-2 border-[#FF4444] flex items-start gap-3 px-4 py-3">
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className="w-5 h-5 text-[#FF4444]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {/* Warning Icon */}
        </svg>
      </div>
      <div className="flex flex-col flex-1">
        <h1 className="font-poppins font-semibold text-sm text-[#FF4444]">
          Nomor HP Belum Terdaftar
        </h1>
        <p className="text-xs text-[#FF4444]/80 mt-1">
          Anda telah mengupload data aktivasi koneksi, tetapi nomor HP belum
          terdaftar. Silakan perbarui nomor HP Anda di halaman edit profil untuk
          proses verifikasi dan pembayaran.
        </p>
        <Link
          href="/profile/edit-profil"
          className="mt-2 text-xs font-semibold text-[#FF4444] underline"
        >
          Tambahkan Nomor HP →
        </Link>
      </div>
    </div>
  );
}
```

**Kondisi Munculnya Warning:**

- `!hasPhone` → User tidak memiliki nomor HP
- `hasConnectionData` → User sudah mengupload data aktivasi koneksi

**Design:**

- Background: Red (#FF4444) dengan opacity 20%
- Border: Red solid 2px
- Icon: Warning triangle
- Link: Mengarah ke halaman edit profil

### 2. **Edit Profile - Tambah Field Nomor HP**

Location: `aqualink-frontpage/app/(pages)/(private)/profile/edit-profil/page.tsx`

**Perubahan:**

```tsx
// State
const [phone, setPhone] = useState<any>(auth.auth.user?.phone || "");

// Field Input
<div className="w-full flex flex-col gap-1">
  <label
    htmlFor="phone"
    className="font-poppins font-semibold text-sm text-[#F5F5F5]"
  >
    Nomor HP
  </label>
  <div className="w-full flex items-center gap-2 p-3 bg-white rounded-xl">
    <PhoneOutlinedIcon sx={{ color: "#6A5AE0" }} />
    <input
      id="phone"
      className="w-[83%] focus:outline-none font-poppins font-semibold text-sm text-[#2C2A2A]"
      type="tel"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      placeholder="08123456789"
    />
  </div>
</div>;

// API Call
API.put(
  `/users/editProfile/${auth.auth.user?.id}`,
  {
    newFullName: fullName,
    newEmail: email,
    newPhone: phone, // ← Tambahan baru
  },
  { headers: { Authorization: auth.auth.token } }
);
```

### 3. **Backend - Update editProfile Endpoint**

Location: `aqualink-backend/controllers/userController.js`

```javascript
export const editProfile = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newFullName, newEmail, newPhone } = req.body; // ← Tambahan

      // ... validation ...

      user.set("fullName", newFullName);
      user.set("email", newEmail);

      // Update phone if provided
      if (newPhone !== undefined) {
        user.set("phone", newPhone || null);
      }

      await user.save();

      // ... notification & response ...
    }
  }
];
```

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Login                                │
│  (Regular Registration or Google OAuth)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Has Phone Number?  │
         └──────┬──────┬───────┘
                │      │
         ┌──────┘      └──────┐
         │ YES               │ NO (OAuth)
         ▼                   ▼
    ┌────────┐          ┌──────────┐
    │ Normal │          │  phone:  │
    │  Flow  │          │   null   │
    └────┬───┘          └─────┬────┘
         │                    │
         └────────┬───────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   User Goes to Profile      │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │  Has Connection Data Upload? │
    └────┬─────────────────┬───────┘
         │ NO              │ YES
         │                 │
         ▼                 ▼
    ┌─────────┐    ┌──────────────────┐
    │ Show:   │    │   Has Phone?     │
    │ "Upload │    └───┬──────────┬───┘
    │  Data"  │        │ YES      │ NO
    └─────────┘        │          │
                       ▼          ▼
                  ┌────────┐  ┌──────────────┐
                  │ Normal │  │ Show Warning │
                  │  Flow  │  │  + Link to   │
                  └────────┘  │ Edit Profile │
                              └──────────────┘
```

## 🎨 UI/UX Considerations

### Warning Alert Design

- **Visibility:** Muncul di bagian atas halaman profile, sebelum section connection status
- **Color Scheme:** Red (#FF4444) untuk urgency
- **Actionable:** Ada link langsung ke edit profil
- **Clear Message:** Menjelaskan mengapa nomor HP diperlukan

### Edit Profile Enhancement

- **Optional Field:** Nomor HP tidak wajib diisi (untuk backward compatibility)
- **Icon:** PhoneOutlinedIcon untuk konsistensi visual
- **Placeholder:** "08123456789" sebagai format contoh
- **Type:** `tel` untuk keyboard optimization di mobile

## 🔒 Data Model

### User Model

```javascript
{
  _id: ObjectId,
  email: String,
  fullName: String,
  phone: String (default: null), // ← Optional untuk OAuth users
  password: String,
  SambunganDataId: ObjectId (ref: ConnectionData),
  meteranId: ObjectId (ref: Meteran),
  isVerified: Boolean,
  token: String
}
```

## 📱 Use Cases

### Case 1: User Register Biasa

1. User register dengan email, password, fullName, phone ✅
2. User bisa langsung upload data aktivasi ✅
3. Nomor HP sudah tersedia untuk Midtrans ✅

### Case 2: User Login via Google (Tanpa Phone)

1. User login via Google OAuth (phone: null) ✅
2. User upload data aktivasi koneksi ✅
3. **Warning muncul:** "Nomor HP Belum Terdaftar" ✅
4. User klik link "Tambahkan Nomor HP →" ✅
5. User ke edit profile, isi nomor HP ✅
6. Nomor HP tersimpan di database ✅
7. Warning hilang dari profile page ✅

### Case 3: User Belum Upload Data (Dengan/Tanpa Phone)

1. User belum upload data aktivasi ✅
2. Warning tidak muncul (karena belum ada connection data) ✅
3. User klik "Aktivasi Koneksi Air" ✅
4. Flow normal aktivasi ✅

## 🔧 Technical Details

### Frontend State Management

```tsx
// Get data from API
const userProfile = await profileMutation.mutateAsync();

// Extract flags
const hasConnectionData = userProfile?.hasConnectionData;
const hasPhone = userProfile?.user?.phone;

// Conditional rendering
{
  !hasPhone && hasConnectionData && <WarningComponent />;
}
```

### Backend Response Format

```javascript
{
  status: 200,
  data: {
    user: {
      _id: "...",
      email: "user@example.com",
      fullName: "John Doe",
      phone: "08123456789" | null, // ← Bisa null untuk OAuth users
      // ... other fields
    },
    hasConnectionData: true,
    hasMeteran: false,
    isVerified: false
  },
  message: "Profil berhasil diambil"
}
```

## 🚀 Integration Points

### 1. Midtrans Payment

```javascript
// billingController.js & rabConnectionController.js
customer_details: {
  first_name: user.fullName,
  email: user.email,
  phone: user.phone || "08123456789", // ← Fallback jika null
}
```

**Sudah ada fallback:** Jika `user.phone` null, akan menggunakan default "08123456789"

### 2. Notification System

- User dengan phone null tetap bisa menerima notifikasi in-app ✅
- Phone number bersifat opsional untuk notifikasi ✅

### 3. Connection Data Verification

- Admin/teknisi bisa melihat nomor HP saat verifikasi ✅
- Jika null, admin bisa hubungi via email ✅

## 📝 Validation Rules

### Registration (TIDAK DIUBAH)

```javascript
// registerUser - validation tetap sama
if (!email || !phone || !fullName || !password) {
  return res.status(400).json({ message: "Silakan isi semua kolom..." });
}
```

**Catatan:** Logic registration TIDAK diubah sesuai request user

### Edit Profile (UPDATED)

```javascript
// editProfile - phone menjadi optional
if (!newFullName || !newEmail) {
  return res.status(400).json({ message: "Semua kolom diperlukan..." });
}

// Phone is optional
if (newPhone !== undefined) {
  user.set("phone", newPhone || null);
}
```

## 🎯 Benefits

1. **Better UX untuk OAuth Users:**

   - User bisa login via Google tanpa masalah
   - User diberi peringatan jelas jika perlu melengkapi data

2. **Data Completeness:**

   - System mengingatkan user untuk melengkapi nomor HP
   - Tidak memblokir user untuk explore aplikasi

3. **Payment Integration:**

   - Midtrans tetap bisa berjalan dengan fallback phone number
   - Mendorong user melengkapi data untuk pengalaman lebih baik

4. **Progressive Disclosure:**
   - Warning hanya muncul saat relevan (setelah upload data)
   - Tidak mengganggu user yang belum butuh fitur connection

## 🧪 Testing Scenarios

### Test 1: User dengan Phone, Upload Data

- ✅ Warning tidak muncul
- ✅ Flow normal berjalan

### Test 2: User tanpa Phone, Belum Upload Data

- ✅ Warning tidak muncul
- ✅ Tombol "Aktivasi Koneksi Air" muncul

### Test 3: User tanpa Phone, Sudah Upload Data

- ✅ Warning muncul dengan pesan yang jelas
- ✅ Link ke edit profile berfungsi
- ✅ User bisa tambah nomor HP

### Test 4: Update Nomor HP di Edit Profile

- ✅ Field nomor HP muncul
- ✅ Save berhasil ke database
- ✅ Warning hilang setelah page refresh

## 📊 Summary

| Kondisi                                     | Warning Muncul? | Action           |
| ------------------------------------------- | --------------- | ---------------- |
| Tidak ada phone + Tidak ada connection data | ❌              | Normal flow      |
| Ada phone + Tidak ada connection data       | ❌              | Normal flow      |
| Ada phone + Ada connection data             | ❌              | Normal flow      |
| **Tidak ada phone + Ada connection data**   | **✅**          | **Show warning** |

## 🔗 Related Files

### Frontend

- `aqualink-frontpage/app/(pages)/(private)/profile/page.tsx` - Main profile page dengan warning
- `aqualink-frontpage/app/(pages)/(private)/profile/edit-profil/page.tsx` - Edit profile dengan field phone

### Backend

- `aqualink-backend/controllers/userController.js` - getUserProfile & editProfile
- `aqualink-backend/models/User.js` - User model dengan phone field
- `aqualink-backend/controllers/billingController.js` - Midtrans payment dengan phone fallback
- `aqualink-backend/controllers/rabConnectionController.js` - RAB payment dengan phone fallback

---

**Status:** ✅ Implemented & Ready
**Date:** 2025-10-03
**Version:** 1.0.0
