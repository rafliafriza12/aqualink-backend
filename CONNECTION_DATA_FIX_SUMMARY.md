# Connection Data - Fix Summary

## 📋 Masalah yang Ditemukan

1. **User bisa upload data koneksi tanpa nomor HP** ❌

   - Seharusnya nomor HP wajib ada sebelum upload
   - Nomor HP diperlukan untuk verifikasi dan pembayaran Midtrans

2. **connectionDataId tidak ter-link ke User model** ❌

   - Setelah create connection data, `user.SambunganDataId` tidak di-update
   - Menyebabkan `hasConnectionData` flag tidak bekerja dengan benar

3. **Delete connection data tidak membersihkan referensi** ❌
   - Saat delete connection data, `user.SambunganDataId` tidak di-clear
   - Menyebabkan orphaned references

## ✅ Perbaikan yang Dilakukan

### 1. Backend: `connectionDataController.js`

#### A. Create Connection Data - Validasi & Link ke User

```javascript
export const createConnectionData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ TAMBAHAN 1: Validasi user exists dan punya phone
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    if (!user.phone) {
      return res.status(400).json({
        status: 400,
        message:
          "Nomor HP harus diisi terlebih dahulu. Silakan lengkapi profil Anda di menu Edit Profil.",
      });
    }

    // Check if user already has connection data
    const existingConnection = await ConnectionData.findOne({ userId });
    if (existingConnection) {
      return res.status(400).json({
        status: 400,
        message: "User already has connection data",
      });
    }

    // ... file upload & create connection data ...

    await connectionData.save();

    // ✅ TAMBAHAN 2: Update User's SambunganDataId
    user.SambunganDataId = connectionData._id;
    await user.save();

    res.status(201).json({
      status: 201,
      message: "Connection data created successfully",
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
```

**Perubahan:**

- ✅ Fetch user data dari database
- ✅ Validasi `user.phone` harus ada (tidak null/empty)
- ✅ Error message yang jelas jika phone belum ada
- ✅ Update `user.SambunganDataId` setelah create connection data
- ✅ Save user untuk persist perubahan

#### B. Delete Connection Data - Clear Reference

```javascript
export const deleteConnectionData = async (req, res) => {
  try {
    const { id } = req.params;

    const connectionData = await ConnectionData.findById(id);

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    // ✅ TAMBAHAN: Remove reference from User
    await User.findByIdAndUpdate(connectionData.userId, {
      SambunganDataId: null,
    });

    await ConnectionData.findByIdAndDelete(id);

    res.status(200).json({
      status: 200,
      message: "Connection data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
```

**Perubahan:**

- ✅ Fetch connection data sebelum delete (untuk dapat userId)
- ✅ Clear `user.SambunganDataId` sebelum delete connection data
- ✅ Mencegah orphaned references

### 2. Frontend: `profile/page.tsx`

#### A. Warning - Harus Isi Phone Dulu

```tsx
{
  /* Warning: No Phone Number - Can't Upload Connection Data */
}
{
  !hasPhone && !hasConnectionData && (
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
          Anda harus melengkapi nomor HP terlebih dahulu sebelum dapat
          mengupload data aktivasi koneksi. Nomor HP diperlukan untuk proses
          verifikasi dan komunikasi.
        </p>
        <Link
          href="/profile/edit-profil"
          className="mt-2 text-xs font-semibold text-[#FF4444] underline"
        >
          Tambahkan Nomor HP Sekarang →
        </Link>
      </div>
    </div>
  );
}
```

**Kondisi Warning:**

- `!hasPhone` → User tidak punya nomor HP
- `!hasConnectionData` → User belum upload data koneksi
- Warning hanya muncul jika KEDUA kondisi terpenuhi

**Pesan:**

- ✅ Jelas: harus isi phone dulu sebelum upload
- ✅ Actionable: ada link ke edit profil
- ✅ Informative: jelaskan kenapa phone diperlukan

#### B. Conditional Button - Disable Jika Belum Ada Phone

```tsx
{!hasConnectionData ? (
  // User belum submit connection data
  hasPhone ? (
    // ✅ HAS PHONE: Show active button
    <Link
      href="/profile/connection-data"
      className="w-full h-[54px] rounded-[24px] bg-gradient-to-r from-[#2835FF] to-[#5F68FE] flex items-center justify-between px-4"
    >
      <div className="flex items-center gap-3">
        <DescriptionIcon sx={{ color: "white" }} />
        <div className="flex flex-col">
          <h1 className="font-poppins font-semibold text-sm text-white">
            Aktivasi Koneksi Air
          </h1>
          <p className="text-xs text-white/70">
            Isi data untuk pemasangan
          </p>
        </div>
      </div>
      <ChevronRight className="text-white" />
    </Link>
  ) : (
    // ✅ NO PHONE: Show disabled button
    <div className="w-full h-[54px] rounded-[24px] bg-gray-400 flex items-center justify-between px-4 opacity-60 cursor-not-allowed">
      <div className="flex items-center gap-3">
        <DescriptionIcon sx={{ color: "white" }} />
        <div className="flex flex-col">
          <h1 className="font-poppins font-semibold text-sm text-white">
            Aktivasi Koneksi Air
          </h1>
          <p className="text-xs text-white/70">
            Lengkapi nomor HP terlebih dahulu
          </p>
        </div>
      </div>
      <ChevronRight className="text-white" />
    </div>
  )
) : !isVerified ? (
  // User sudah submit, menunggu verifikasi
  // ... existing code ...
```

**Perubahan:**

- ✅ Nested conditional: cek `hasPhone` sebelum render button
- ✅ Jika punya phone → Button aktif (Link ke upload page)
- ✅ Jika tidak punya phone → Button disabled (gray, opacity, cursor-not-allowed)
- ✅ Text berbeda: "Lengkapi nomor HP terlebih dahulu"

## 🔄 Flow Diagram Baru

### Scenario 1: User Tanpa Phone (Google Login)

```
┌───────────────────────┐
│  User Login (Google)  │
│    phone: null        │
└──────────┬────────────┘
           │
           ▼
┌──────────────────────────┐
│   Profile Page           │
│   hasPhone: false        │
│   hasConnectionData: false│
└──────────┬───────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ ⚠️ WARNING MUNCUL:                     │
│ "Nomor HP Belum Terdaftar"            │
│ + Link "Tambahkan Nomor HP Sekarang"  │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ 🔘 Button "Aktivasi Koneksi Air"      │
│    Status: DISABLED (gray)            │
│    Text: "Lengkapi nomor HP dahulu"   │
└────────────────────────────────────────┘
           │
           │ User klik warning link
           ▼
┌────────────────────────┐
│   Edit Profile Page    │
│   + Input Nomor HP     │
└──────────┬─────────────┘
           │ Save
           ▼
┌────────────────────────┐
│  Back to Profile Page  │
│  hasPhone: true ✅     │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ ✅ WARNING HILANG                      │
│ ✅ Button "Aktivasi Koneksi Air"      │
│    Status: ACTIVE (blue gradient)     │
│    Can navigate to upload page        │
└────────────────────────────────────────┘
```

### Scenario 2: User Upload Data Koneksi (Backend)

```
┌──────────────────────────────────┐
│  POST /connection-data           │
│  + files (NIK, KK, IMB PDFs)    │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Validate: User.phone exists?    │
└──────┬───────────────────────┬───┘
       │ NO                    │ YES
       ▼                       ▼
┌──────────────┐      ┌────────────────────┐
│  ❌ ERROR    │      │  ✅ Create         │
│  400         │      │  ConnectionData    │
│  "Nomor HP   │      └────────┬───────────┘
│   harus diisi│               │
│   dahulu"    │               ▼
└──────────────┘      ┌────────────────────┐
                      │  ✅ Update User:   │
                      │  SambunganDataId = │
                      │  connectionData._id│
                      └────────┬───────────┘
                               │
                               ▼
                      ┌────────────────────┐
                      │  ✅ Return 201     │
                      │  Success           │
                      └────────────────────┘
```

### Scenario 3: Delete Connection Data

```
┌──────────────────────────────────┐
│  DELETE /connection-data/:id     │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Find ConnectionData by ID       │
└──────┬───────────────────────┬───┘
       │ NOT FOUND             │ FOUND
       ▼                       ▼
┌──────────────┐      ┌────────────────────┐
│  ❌ ERROR    │      │  Get userId from   │
│  404         │      │  connectionData    │
└──────────────┘      └────────┬───────────┘
                               │
                               ▼
                      ┌────────────────────┐
                      │  ✅ Clear User:    │
                      │  SambunganDataId = │
                      │  null              │
                      └────────┬───────────┘
                               │
                               ▼
                      ┌────────────────────┐
                      │  ✅ Delete         │
                      │  ConnectionData    │
                      └────────┬───────────┘
                               │
                               ▼
                      ┌────────────────────┐
                      │  ✅ Return 200     │
                      │  Success           │
                      └────────────────────┘
```

## 🧪 Test Cases

### Test 1: User Tanpa Phone - Coba Upload Data

**Input:**

- User dengan `phone: null`
- POST `/connection-data` dengan files

**Expected:**

- ❌ Error 400
- Message: "Nomor HP harus diisi terlebih dahulu..."

**Frontend:**

- ⚠️ Warning visible
- 🔘 Button disabled (gray)

### Test 2: User dengan Phone - Upload Data

**Input:**

- User dengan `phone: "08123456789"`
- POST `/connection-data` dengan files

**Expected:**

- ✅ Success 201
- ConnectionData created
- `user.SambunganDataId` = connectionData.\_id

**Frontend:**

- ✅ Button active (blue gradient)
- ✅ Can navigate to upload page
- ✅ After upload: shows "Menunggu Verifikasi"

### Test 3: Delete Connection Data

**Input:**

- DELETE `/connection-data/:id`

**Expected:**

- ✅ Success 200
- ConnectionData deleted
- `user.SambunganDataId` = null

**Frontend:**

- ✅ Back to initial state
- ✅ Button "Aktivasi Koneksi Air" muncul lagi

### Test 4: getUserProfile Returns Correct Flags

**Input:**

- GET `/users/profile`

**Expected Response:**

```json
{
  "status": 200,
  "data": {
    "user": {
      "_id": "...",
      "phone": "08123456789" | null,
      "SambunganDataId": "..." | null
    },
    "hasConnectionData": true | false,  // ← Based on SambunganDataId
    "hasMeteran": true | false,
    "isVerified": true | false
  }
}
```

## 📊 Database Consistency

### Before Fix ❌

```
User Collection:
{
  _id: "user123",
  email: "user@example.com",
  phone: null,
  SambunganDataId: null  ← Never updated!
}

ConnectionData Collection:
{
  _id: "conn456",
  userId: "user123",
  nik: "...",
  // ...
}

Result: Orphaned data, hasConnectionData always false
```

### After Fix ✅

```
User Collection:
{
  _id: "user123",
  email: "user@example.com",
  phone: "08123456789",
  SambunganDataId: "conn456"  ← Properly linked!
}

ConnectionData Collection:
{
  _id: "conn456",
  userId: "user123",
  nik: "...",
  // ...
}

Result: Bidirectional reference, hasConnectionData works correctly
```

## 🔗 Related Controllers

### Controllers yang Sudah Benar (No Changes Needed)

1. **meteranController.js** ✅

   - Line 57: `user.SambunganDataId = connectionDataId;`
   - Sudah set `SambunganDataId` saat create meteran (sebagai fallback)
   - Tidak perlu diubah

2. **surveyDataController.js** ✅

   - Hanya update `connectionData.surveiId`
   - Tidak perlu ubah User model
   - Sudah benar

3. **rabConnectionController.js** ✅

   - Hanya update `connectionData.rabConnectionId`
   - Tidak perlu ubah User model
   - Sudah benar

4. **userController.js** ✅
   - `getUserProfile` sudah return `hasConnectionData: !!user.SambunganDataId`
   - Sudah benar, tidak perlu diubah

## 📁 Files Modified

### Backend

1. ✅ `aqualink-backend/controllers/connectionDataController.js`
   - `createConnectionData()` - Add phone validation + link to User
   - `deleteConnectionData()` - Clear User reference

### Frontend

2. ✅ `aqualink-frontpage/app/(pages)/(private)/profile/page.tsx`
   - Warning condition: `!hasPhone && !hasConnectionData`
   - Message: "harus isi phone dulu"
   - Button: Conditional render (active vs disabled)

### Documentation

3. ✅ `aqualink-backend/CONNECTION_DATA_FIX_SUMMARY.md` (this file)

## ✅ Checklist

- [x] Backend: Validasi phone sebelum create connection data
- [x] Backend: Update `user.SambunganDataId` setelah create
- [x] Backend: Clear `user.SambunganDataId` saat delete
- [x] Frontend: Warning jika belum ada phone
- [x] Frontend: Button disabled jika belum ada phone
- [x] Frontend: Message yang jelas dan actionable
- [x] Test: User tanpa phone tidak bisa upload
- [x] Test: User dengan phone bisa upload
- [x] Test: SambunganDataId ter-link dengan benar
- [x] Test: Delete connection data membersihkan reference
- [x] Documentation: Complete summary

## 🎯 Benefits

1. **Data Integrity** ✅

   - Bidirectional reference antara User ↔ ConnectionData
   - Tidak ada orphaned data
   - hasConnectionData flag bekerja dengan benar

2. **Business Logic** ✅

   - Phone number wajib sebelum upload data koneksi
   - Mencegah proses verifikasi tanpa contact info
   - Midtrans payment tidak akan gagal karena missing phone

3. **User Experience** ✅

   - Error message yang jelas
   - Visual feedback (disabled button)
   - Clear call-to-action (link to edit profile)

4. **Code Quality** ✅
   - Proper validation
   - Clean up on delete
   - Consistent state management

---

**Status:** ✅ Fixed & Tested
**Date:** 2025-10-03
**Version:** 2.0.0
