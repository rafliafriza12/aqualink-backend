# View Connection Data Feature

## 📋 Overview

Halaman baru untuk user melihat detail data aktivasi koneksi air yang sudah diupload. Sebelumnya user hanya bisa upload data tapi tidak ada halaman untuk melihat detail data yang sudah disubmit.

## 🎯 Tujuan

Memberikan transparansi kepada user untuk:

1. Melihat data aktivasi yang sudah diupload
2. Memeriksa status verifikasi (admin, teknisi, prosedur lengkap)
3. Mengakses dokumen yang telah diupload (NIK, KK, IMB)
4. Tracking progress verifikasi

## ✨ Fitur

### 1. **Informasi Data Lengkap**

- NIK dengan link ke dokumen
- Nomor Kartu Keluarga dengan link ke dokumen
- Alamat lengkap (dengan kelurahan & kecamatan)
- Nomor IMB dengan link ke dokumen
- Luas bangunan (m²)

### 2. **Status Verifikasi**

Badge status dengan color coding:

- 🟢 **Hijau**: Semua proses selesai (isAllProcedureDone)
- 🔵 **Biru**: Terverifikasi oleh teknisi/admin
- 🟠 **Orange**: Menunggu verifikasi

### 3. **Progress Tracker**

Checklist visual untuk tracking:

- ✅ Verifikasi Data oleh Admin
- ✅ Verifikasi oleh Teknisi
- ✅ Semua Prosedur Selesai

### 4. **Akses Dokumen**

Button untuk membuka dokumen di tab baru:

- Dokumen NIK (PDF/Image)
- Dokumen KK (PDF/Image)
- Dokumen IMB (PDF/Image)

## 📁 File Structure

```
app/
├── (pages)/
│   └── (private)/
│       └── profile/
│           ├── page.tsx                      # ← Updated: Add link to view page
│           ├── connection-data/
│           │   └── page.tsx                  # Upload page (existing)
│           └── view-connection-data/
│               └── page.tsx                  # ← NEW: View detail page
└── services/
    └── connectionData/
        ├── connectionData.service.ts         # ← Already has getMyConnectionData
        ├── connectionData.mutation.ts        # ← Already has useGetMyConnectionData
        └── connectionData.type.ts            # ← Type definitions
```

## 🆕 New Page: view-connection-data/page.tsx

### Component Structure

```tsx
ViewConnectionDataPage
├── Loading State (spinner)
├── Empty State (no data found)
└── Main Content
    ├── Header (back button + title)
    ├── Verification Status Card (badge)
    ├── Data Sections (6 cards)
    │   ├── NIK Card
    │   ├── No KK Card
    │   ├── Alamat Card
    │   ├── No IMB Card
    │   ├── Luas Bangunan Card
    │   └── Verification Progress Card
    └── Back Button
```

### Key Features

#### 1. Data Fetching

```tsx
const getConnectionMutation = useGetMyConnectionData();

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await getConnectionMutation.mutateAsync();
      if (result?.data) {
        setConnectionData(result.data);
      }
    } catch (error) {
      console.error("Error fetching connection data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);
```

#### 2. Status Badge Logic

```tsx
const getVerificationStatus = () => {
  if (connectionData.isAllProcedureDone) {
    return {
      text: "Semua Proses Selesai",
      color: "text-green-500",
      icon: <CheckCircle />,
    };
  }
  if (connectionData.isVerifiedByTechnician) {
    return {
      text: "Terverifikasi oleh Teknisi",
      color: "text-blue-500",
      icon: <CheckCircle />,
    };
  }
  if (connectionData.isVerifiedByData) {
    return {
      text: "Terverifikasi oleh Admin",
      color: "text-blue-500",
      icon: <CheckCircle />,
    };
  }
  return {
    text: "Menunggu Verifikasi",
    color: "text-orange-500",
    icon: <HourglassEmpty />,
  };
};
```

#### 3. Document Viewer

```tsx
const handleOpenDocument = (url: string) => {
  window.open(url, "_blank");
};

<button
  onClick={() => handleOpenDocument(connectionData.nikUrl)}
  className="text-[#5F68FE] text-sm font-poppins underline"
>
  Lihat Dokumen →
</button>;
```

## 🔄 Profile Page Updates

### Before ❌

```tsx
{
  !isVerified ? (
    <>
      <StatusCard />
      <RabPaymentButton />
    </>
  ) : (
    <IoTConnectionButton />
  );
}
```

### After ✅

```tsx
{
  !isVerified ? (
    <>
      <StatusCard />
      <ViewConnectionDataButton /> {/* ← NEW */}
      <RabPaymentButton />
    </>
  ) : (
    <>
      <ViewConnectionDataButton /> {/* ← NEW */}
      <IoTConnectionButton />
    </>
  );
}
```

**Changes:**

- ✅ Add "Lihat Data Aktivasi" button after status card
- ✅ Available for both verified and unverified users
- ✅ Consistent placement in both states

## 🎨 UI/UX Design

### Color Scheme

- **Background**: Dark gradient (#0F1117 to #1a1d29)
- **Cards**: Dark gray (#202226)
- **Primary**: Blue (#2835FF, #5F68FE)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f97316)
- **Accent**: Purple/Blue gradient

### Status Colors

| Status                | Color     | Icon           | Description                   |
| --------------------- | --------- | -------------- | ----------------------------- |
| Menunggu Verifikasi   | 🟠 Orange | HourglassEmpty | Initial state                 |
| Terverifikasi Admin   | 🔵 Blue   | CheckCircle    | isVerifiedByData = true       |
| Terverifikasi Teknisi | 🔵 Blue   | CheckCircle    | isVerifiedByTechnician = true |
| Semua Selesai         | 🟢 Green  | CheckCircle    | isAllProcedureDone = true     |

### Responsive Design

- Mobile-first approach
- Fixed header with back button
- Scrollable content area
- Touch-friendly buttons (min 44px height)
- Readable font sizes (14px-24px)

## 📱 User Flow

### Flow 1: User Menunggu Verifikasi

```
Profile Page
    ↓
Click "Lihat Data Aktivasi"
    ↓
View Connection Data Page
    ├─ Status: "Menunggu Verifikasi" (Orange)
    ├─ All data visible
    ├─ Documents accessible
    └─ Progress: Only upload done ✅
```

### Flow 2: User Sudah Terverifikasi

```
Profile Page
    ↓
Click "Lihat Data Aktivasi"
    ↓
View Connection Data Page
    ├─ Status: "Terverifikasi" (Blue/Green)
    ├─ All data visible
    ├─ Documents accessible
    └─ Progress: Multiple steps done ✅✅✅
```

### Flow 3: Akses Dokumen

```
View Connection Data Page
    ↓
Click "Lihat Dokumen →"
    ↓
New Tab Opens
    └─ Display PDF/Image from Cloudinary
```

## 🔧 API Integration

### Endpoint Used

```
GET /connection-data/my-connection
```

**Headers:**

```json
{
  "Authorization": "Bearer {token}"
}
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "_id": "...",
    "userId": { ... },
    "nik": "1234567890123456",
    "nikUrl": "https://cloudinary.com/...",
    "noKK": "1234567890123456",
    "kkUrl": "https://cloudinary.com/...",
    "alamat": "Jl. Example No. 123",
    "kecamatan": "Example Kecamatan",
    "kelurahan": "Example Kelurahan",
    "noImb": "IMB/2024/001",
    "imbUrl": "https://cloudinary.com/...",
    "luasBangunan": 120,
    "isVerifiedByData": true,
    "isVerifiedByTechnician": false,
    "isAllProcedureDone": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Service Layer

```typescript
// connectionData.service.ts
export const getMyConnectionData = async (token: string) => {
  try {
    const response = await API.get("/connection-data/my-connection", {
      headers: { Authorization: token },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

### React Query Hook

```typescript
// connectionData.mutation.ts
export const useGetMyConnectionData = () => {
  const auth = useAuth();

  return useMutation({
    mutationFn: () => getMyConnectionData(auth.auth.token || ""),
    onError: (error: any) => {
      console.error("Error fetching connection data:", error);
    },
  });
};
```

## 📊 Data Display

### Card Layout

#### 1. NIK Card

```
┌────────────────────────────────┐
│ 📄 NIK                         │
│ 1234567890123456               │
│ [Lihat Dokumen →]              │
└────────────────────────────────┘
```

#### 2. KK Card

```
┌────────────────────────────────┐
│ 🏠 Nomor Kartu Keluarga        │
│ 1234567890123456               │
│ [Lihat Dokumen →]              │
└────────────────────────────────┘
```

#### 3. Alamat Card

```
┌────────────────────────────────┐
│ 📍 Alamat Lengkap              │
│ Jl. Example No. 123            │
│ [Kelurahan: XXX] [Kecamatan: Y]│
└────────────────────────────────┘
```

#### 4. Progress Card

```
┌────────────────────────────────┐
│ Status Verifikasi              │
│ ✅ Verifikasi Data oleh Admin  │
│ ⚪ Verifikasi oleh Teknisi     │
│ ⚪ Semua Prosedur Selesai       │
└────────────────────────────────┘
```

## 🧪 Test Scenarios

### Test 1: User Belum Upload Data

**Setup:** User without connection data

**Expected:**

- Show empty state
- Message: "Data aktivasi koneksi tidak ditemukan"
- Button: "Kembali ke Profile"

### Test 2: User Baru Upload (Menunggu Verifikasi)

**Setup:**

- User has connection data
- isVerifiedByData = false
- isVerifiedByTechnician = false

**Expected:**

- Status badge: Orange "Menunggu Verifikasi"
- All data visible
- Documents accessible
- Progress: All unchecked

### Test 3: Admin Sudah Verifikasi

**Setup:**

- isVerifiedByData = true
- isVerifiedByTechnician = false

**Expected:**

- Status badge: Blue "Terverifikasi oleh Admin"
- Progress: First step checked ✅

### Test 4: Teknisi Sudah Verifikasi

**Setup:**

- isVerifiedByData = true
- isVerifiedByTechnician = true
- isAllProcedureDone = false

**Expected:**

- Status badge: Blue "Terverifikasi oleh Teknisi"
- Progress: First two steps checked ✅✅

### Test 5: Semua Proses Selesai

**Setup:**

- isAllProcedureDone = true

**Expected:**

- Status badge: Green "Semua Proses Selesai"
- Progress: All steps checked ✅✅✅

### Test 6: Akses Dokumen

**Action:** Click "Lihat Dokumen →"

**Expected:**

- New tab opens
- Document URL from Cloudinary loads
- Original tab remains on view page

## 🎯 Benefits

### For Users ✅

1. **Transparency**: Lihat semua data yang sudah disubmit
2. **Tracking**: Monitor progress verifikasi
3. **Access**: Akses dokumen kapan saja
4. **Peace of Mind**: Tahu status aplikasi mereka

### For Support Team ✅

1. **Reduced Inquiries**: User bisa cek sendiri
2. **Self-Service**: User tidak perlu tanya status
3. **Clarity**: Jelas step mana yang pending

### For Business ✅

1. **Better UX**: Improve user satisfaction
2. **Efficiency**: Reduce support workload
3. **Trust**: Transparent process builds trust

## 📝 Implementation Checklist

- [x] Create view-connection-data page component
- [x] Implement data fetching with useGetMyConnectionData
- [x] Add loading state (spinner)
- [x] Add empty state (no data)
- [x] Display all connection data fields
- [x] Add document viewer (open in new tab)
- [x] Implement status badge with color coding
- [x] Add verification progress tracker
- [x] Format date display (Indonesian locale)
- [x] Add back navigation buttons
- [x] Update profile page with link
- [x] Mobile responsive design
- [x] Dark theme styling
- [x] Error handling
- [x] Documentation

## 🔗 Navigation Structure

```
Profile Page
├── Aktivasi Koneksi Air (if !hasConnectionData)
├── Lihat Data Aktivasi (if hasConnectionData) ← NEW
├── Pembayaran RAB (if !isVerified)
├── Status Koneksi IoT (if isVerified)
└── ... other menu items
```

## 📁 Files Created/Modified

### Created

1. ✅ `/app/(pages)/(private)/profile/view-connection-data/page.tsx`
   - New page component
   - ~400 lines
   - Full featured view

### Modified

2. ✅ `/app/(pages)/(private)/profile/page.tsx`
   - Add "Lihat Data Aktivasi" link
   - Available in both verified/unverified states

### Existing (No Changes)

3. `/app/services/connectionData/connectionData.service.ts` - Already has getMyConnectionData
4. `/app/services/connectionData/connectionData.mutation.ts` - Already has useGetMyConnectionData

## 🚀 Deployment Notes

- No backend changes required
- No database migration needed
- API endpoint already exists
- Frontend-only implementation
- Can be deployed immediately
- Backward compatible

---

**Status:** ✅ Implemented & Ready
**Date:** 2025-10-03
**Version:** 1.0.0
**Priority:** High (User-requested feature)
