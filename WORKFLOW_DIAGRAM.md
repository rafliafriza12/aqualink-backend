# Aqualink Backend - Complete Workflow Diagram

## 🔄 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AQUALINK PDAM SYSTEM WORKFLOW                       │
│                         (PDF Document Upload System)                         │
└─────────────────────────────────────────────────────────────────────────────┘

FASE 1: REGISTRASI & SETUP AWAL
═══════════════════════════════════════════════════════════════════════════════

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ADMIN      │────→│  TECHNICIAN  │────→│    USER      │
│ Registration │     │  Creation    │     │ Registration │
└──────────────┘     └──────────────┘     └──────────────┘
      │                     │                     │
      ↓                     ↓                     ↓
[Admin Login]        [Tech Login]          [User Login]
      │                     │                     │
      ↓                     ↓                     ↓
 ADMIN_TOKEN          TECH_TOKEN             USER_TOKEN


FASE 2: INPUT DATA SAMBUNGAN (USER)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 1: User Upload Connection Data                                         │
│ POST /connection-data                                                        │
│ Auth: USER_TOKEN                                                             │
│                                                                              │
│ Form Data (multipart/form-data):                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • nik: "3201234567890123"                                              │ │
│ │ • nikFile: [PDF File] ──→ Upload to Cloudinary ──→ nikUrl             │ │
│ │ • noKK: "3201234567890001"                                             │ │
│ │ • kkFile: [PDF File] ──→ Upload to Cloudinary ──→ kkUrl               │ │
│ │ • alamat: "Jl. Merdeka No. 123"                                        │ │
│ │ • kecamatan: "Bandung Wetan"                                           │ │
│ │ • kelurahan: "Cihapit"                                                 │ │
│ │ • noImb: "IMB/2024/001"                                                │ │
│ │ • imbFile: [PDF File] ──→ Upload to Cloudinary ──→ imbUrl             │ │
│ │ • luasBangunan: 100                                                    │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Database: ConnectionData                                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ userId: [User ObjectId]                                                │ │
│ │ nik: "3201234567890123"                                                │ │
│ │ nikUrl: "https://res.cloudinary.com/.../nik.pdf"                       │ │
│ │ noKK: "3201234567890001"                                               │ │
│ │ kkUrl: "https://res.cloudinary.com/.../kk.pdf"                         │ │
│ │ imbUrl: "https://res.cloudinary.com/.../imb.pdf"                       │ │
│ │ isVerifiedByData: false                                                │ │
│ │ isVerifiedByTechnician: false                                          │ │
│ │ isAllProcedureDone: false                                              │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓

FASE 3: VERIFIKASI DATA OLEH ADMIN
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 2: Admin Reviews and Verifies Connection Data                          │
│ PUT /connection-data/:id/verify-admin                                        │
│ Auth: ADMIN_TOKEN                                                            │
│                                                                              │
│ Database Update: ConnectionData                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ isVerifiedByData: true ✅                                               │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓

FASE 4: SURVEY LAPANGAN (TECHNICIAN)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 3: Technician Conducts Survey and Uploads Documents                    │
│ POST /survey-data                                                            │
│ Auth: TECH_TOKEN                                                             │
│                                                                              │
│ Form Data (multipart/form-data):                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • connectionDataId: [ConnectionData ObjectId]                          │ │
│ │ • jaringanFile: [PDF] ──→ Cloudinary ──→ jaringanUrl                  │ │
│ │ • diameterPipa: 3                                                      │ │
│ │ • posisiBakFile: [PDF] ──→ Cloudinary ──→ posisiBakUrl                │ │
│ │ • posisiMeteranFile: [PDF] ──→ Cloudinary ──→ posisiMeteranUrl        │ │
│ │ • jumlahPenghuni: 5                                                    │ │
│ │ • koordinatLat: -6.914744                                              │ │
│ │ • koordinatLong: 107.609810                                            │ │
│ │ • standar: true                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Database: SurveyData                                                         │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ connectionDataId: [ConnectionData ObjectId]                            │ │
│ │ userId: [User ObjectId]                                                │ │
│ │ jaringanUrl: "https://res.cloudinary.com/.../jaringan.pdf"             │ │
│ │ posisiBakUrl: "https://res.cloudinary.com/.../bak.pdf"                 │ │
│ │ posisiMeteranUrl: "https://res.cloudinary.com/.../meteran.pdf"         │ │
│ │ koordinat: { lat: -6.914744, long: 107.609810 }                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Auto Update: ConnectionData                                                  │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ surveiId: [SurveyData ObjectId] ✅                                      │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 4: Technician Verifies Connection Data                                 │
│ PUT /connection-data/:id/verify-technician                                   │
│ Auth: TECH_TOKEN                                                             │
│                                                                              │
│ Database Update: ConnectionData                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ isVerifiedByTechnician: true ✅                                         │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓

FASE 5: PEMBUATAN RAB (TECHNICIAN)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 5: Technician Creates RAB (Budget Estimate)                            │
│ POST /rab-connection                                                         │
│ Auth: TECH_TOKEN                                                             │
│                                                                              │
│ Form Data (multipart/form-data):                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • connectionDataId: [ConnectionData ObjectId]                          │ │
│ │ • totalBiaya: 5000000                                                  │ │
│ │ • rabFile: [PDF File] ──→ Cloudinary ──→ rabUrl                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Database: RabConnection                                                      │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ connectionDataId: [ConnectionData ObjectId]                            │ │
│ │ userId: [User ObjectId]                                                │ │
│ │ totalBiaya: 5000000                                                    │ │
│ │ rabUrl: "https://res.cloudinary.com/.../rab.pdf"                       │ │
│ │ isPaid: false                                                          │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Auto Update: ConnectionData                                                  │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ rabConnectionId: [RabConnection ObjectId] ✅                            │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓

FASE 6: PEMBAYARAN RAB (USER)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 6: User Pays RAB                                                        │
│ PUT /rab-connection/:id/payment                                              │
│ Auth: USER_TOKEN                                                             │
│                                                                              │
│ Body (JSON):                                                                 │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ { "isPaid": true }                                                     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Database Update: RabConnection                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ isPaid: true ✅                                                         │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓

FASE 7: PENYELESAIAN PROSEDUR (ADMIN)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 7: Admin Completes All Procedures                                      │
│ PUT /connection-data/:id/complete-procedure                                  │
│ Auth: ADMIN_TOKEN                                                            │
│                                                                              │
│ Validation:                                                                  │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ ✅ Check if RAB exists                                                 │ │
│ │ ✅ Check if RAB is paid                                                │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Database Update: ConnectionData                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ isAllProcedureDone: true ✅                                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ↓

FASE 8: PEMBUATAN METERAN & AKTIVASI USER (ADMIN)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ Step 8: Admin Creates Meteran and Activates User                            │
│ POST /meteran                                                                │
│ Auth: ADMIN_TOKEN                                                            │
│                                                                              │
│ Body (JSON):                                                                 │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ {                                                                      │ │
│ │   "noMeteran": "MTR2024001",                                           │ │
│ │   "kelompokPelangganId": [KelompokPelanggan ObjectId],                 │ │
│ │   "userId": [User ObjectId],                                           │ │
│ │   "connectionDataId": [ConnectionData ObjectId],                       │ │
│ │   "totalPemakaian": 0,                                                 │ │
│ │   "pemakaianBelumTerbayar": 0,                                         │ │
│ │   "jatuhTempo": null                                                   │ │
│ │ }                                                                      │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Database: Meteran                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ noMeteran: "MTR2024001"                                                │ │
│ │ kelompokPelangganId: [KelompokPelanggan ObjectId]                      │ │
│ │ userId: [User ObjectId]                                                │ │
│ │ totalPemakaian: 0                                                      │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 🎯 AUTO UPDATE: User (CRITICAL!)                                             │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ meteranId: [Meteran ObjectId] ✅                                        │ │
│ │ SambunganDataId: [ConnectionData ObjectId] ✅                           │ │
│ │ isVerified: true ✅                                                     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘


FINAL STATE: USER ACTIVATED
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                          ✅ USER FULLY ACTIVATED                             │
│                                                                              │
│ User Object:                                                                 │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ email: "john@example.com"                                              │ │
│ │ fullName: "John Doe"                                                   │ │
│ │ isVerified: true ✅                                                     │ │
│ │ SambunganDataId: [ConnectionData ObjectId] ✅                           │ │
│ │ meteranId: [Meteran ObjectId] ✅                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Connection Data:                                                             │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ isVerifiedByData: true ✅                                               │ │
│ │ isVerifiedByTechnician: true ✅                                         │ │
│ │ isAllProcedureDone: true ✅                                             │ │
│ │ surveiId: [SurveyData ObjectId] ✅                                      │ │
│ │ rabConnectionId: [RabConnection ObjectId] ✅                            │ │
│ │ nikUrl: "https://res.cloudinary.com/.../nik.pdf" ✅                     │ │
│ │ kkUrl: "https://res.cloudinary.com/.../kk.pdf" ✅                       │ │
│ │ imbUrl: "https://res.cloudinary.com/.../imb.pdf" ✅                     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Survey Data:                                                                 │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ jaringanUrl: "https://res.cloudinary.com/.../jaringan.pdf" ✅           │ │
│ │ posisiBakUrl: "https://res.cloudinary.com/.../bak.pdf" ✅               │ │
│ │ posisiMeteranUrl: "https://res.cloudinary.com/.../meteran.pdf" ✅       │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ RAB Connection:                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ isPaid: true ✅                                                         │ │
│ │ rabUrl: "https://res.cloudinary.com/.../rab.pdf" ✅                     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ Meteran:                                                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ noMeteran: "MTR2024001" ✅                                              │ │
│ │ kelompokPelangganId: [KelompokPelanggan ObjectId] ✅                    │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ 🎉 USER CAN NOW USE THE SYSTEM!                                              │
└─────────────────────────────────────────────────────────────────────────────┘


CLOUDINARY FOLDER STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

aqualink/
├── nik/
│   └── [user_id]_nik_[timestamp].pdf
├── kk/
│   └── [user_id]_kk_[timestamp].pdf
├── imb/
│   └── [user_id]_imb_[timestamp].pdf
├── survey/
│   ├── jaringan/
│   │   └── [connection_id]_jaringan_[timestamp].pdf
│   ├── bak/
│   │   └── [connection_id]_bak_[timestamp].pdf
│   └── meteran/
│       └── [connection_id]_meteran_[timestamp].pdf
└── rab/
    └── [connection_id]_rab_[timestamp].pdf


VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before Each Step:
□ Step 2 (Admin Verify): Check connectionData exists
□ Step 3 (Survey): Check isVerifiedByData = true
□ Step 4 (Tech Verify): Check surveyData exists
□ Step 5 (Create RAB): Check isVerifiedByTechnician = true
□ Step 6 (Pay RAB): Check rabConnection exists
□ Step 7 (Complete): Check isPaid = true
□ Step 8 (Create Meteran): Check isAllProcedureDone = true

File Upload Requirements:
□ All files must be PDF format (application/pdf)
□ Maximum file size: 5MB
□ Use multipart/form-data content type
□ Files are stored as Buffer in memory before Cloudinary upload
```

---

## 📊 Summary Statistics

- **Total Phases**: 8
- **Total API Calls**: 8-10 (depending on verification steps)
- **Total PDF Uploads**: 7 files
  - 3 files for Connection Data (NIK, KK, IMB)
  - 3 files for Survey Data (Jaringan, Bak, Meteran)
  - 1 file for RAB
- **Total Database Collections**: 7
  - Users
  - AdminAccount
  - Technician
  - ConnectionData
  - SurveyData
  - RabConnection
  - Meteran
  - KelompokPelanggan

---

## 🔑 Key Points

1. ✅ All file uploads use **multipart/form-data**
2. ✅ Only **PDF files** are accepted
3. ✅ Files are stored in **Cloudinary** automatically
4. ✅ Each step has **validation** checks
5. ✅ User is activated **automatically** after meteran creation
6. ✅ Complete **audit trail** through timestamps
7. ✅ Role-based access control (User, Admin, Technician)
