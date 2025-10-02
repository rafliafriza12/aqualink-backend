# Aqualink Backend - PDAM Water Monitoring & Billing System

Backend system untuk aplikasi monitoring penggunaan air dan tagihan otomatis PDAM dengan **PDF file upload**.

## 📋 Fitur Utama

### User Management

- ✅ Registrasi dan login user
- ✅ Profile management
- ✅ Verifikasi user otomatis setelah proses selesai

### Connection Data Management

- ✅ User mengisi data sambungan (NIK, KK, IMB)
- ✅ **Upload dokumen PDF ke Cloudinary**
- ✅ Verifikasi oleh admin
- ✅ Verifikasi oleh teknisi
- ✅ Status tracking lengkap

### Survey Data Management

- ✅ Teknisi melakukan survey lapangan
- ✅ **Upload PDF dokumen survey** (jaringan, posisi bak, posisi meteran)
- ✅ Data teknis (diameter pipa, koordinat, dll)

### RAB (Budget Estimate) Management

- ✅ Teknisi membuat RAB
- ✅ **Upload dokumen RAB dalam format PDF**
- ✅ User melakukan pembayaran RAB
- ✅ Status pembayaran tracking

### Meteran Management

- ✅ Admin membuat data meteran setelah semua prosedur selesai
- ✅ Integrasi dengan kelompok pelanggan
- ✅ Tracking pemakaian dan tagihan

### Admin Features

- ✅ Manajemen teknisi
- ✅ Verifikasi data sambungan
- ✅ Manajemen kelompok pelanggan
- ✅ Manajemen meteran

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Token)
- **File Upload**: Multer + Cloudinary (PDF files)
- **Password Hashing**: bcryptjs

## 📦 Installation

1. Clone repository

```bash
git clone https://github.com/rafliafriza12/aqualink-backend.git
cd aqualink-backend
```

2. Install dependencies

```bash
yarn install
# or
npm install
```

3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` file dengan credentials Anda:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=dy76yigwi
CLOUDINARY_API_KEY=536836458837658
CLOUDINARY_API_SECRET=uo1-Ub3XNHlAYpUPk5Ozci7ijTI
```

4. Run the server

```bash
yarn start
# or
npm start
```

Server akan berjalan di `http://localhost:5000`

## 📁 Project Structure

```
aqualink-backend/
├── controllers/           # Business logic
│   ├── connectionDataController.js
│   ├── surveyDataController.js
│   ├── rabConnectionController.js
│   ├── meteranController.js
│   ├── kelompokPelangganController.js
│   └── technicianController.js
├── models/               # Database schemas
│   ├── User.js
│   ├── AdminAccount.js
│   ├── Technician.js
│   ├── ConnectionData.js
│   ├── SurveyData.js
│   ├── RabConnection.js
│   ├── Meteran.js
│   └── KelompokPelanggan.js
├── routes/               # API endpoints
│   ├── connectionDataRoutes.js
│   ├── surveyDataRoutes.js
│   ├── rabConnectionRoutes.js
│   ├── meteranRoutes.js
│   ├── kelompokPelangganRoutes.js
│   └── technicianRoutes.js
├── middleware/           # Middleware functions
│   ├── auth.js          # User authentication
│   ├── adminAuth.js     # Admin authentication
│   └── technicianAuth.js # Technician authentication
├── utils/                # Utility functions
│   └── cloudinary.js    # Cloudinary upload helper
├── server.js            # Main application file
└── .env                 # Environment variables
```

## 🔐 Authentication

### User Roles

1. **User** - Pelanggan PDAM
2. **Admin** - Administrator sistem
3. **Technician** - Teknisi lapangan

### Middleware

- `verifyToken` - Untuk user authentication
- `verifyAdmin` - Untuk admin authentication
- `verifyTechnician` - Untuk technician authentication

## 📖 API Documentation

Lihat [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk dokumentasi lengkap API endpoints.

## 🔄 Workflow Proses

1. **User Registration & Login**

   - User mendaftar dan login ke sistem

2. **Input Data Sambungan**

   - User mengisi data sambungan (NIK, KK, IMB)
   - Upload dokumen ke Cloudinary

3. **Verifikasi Admin**

   - Admin memverifikasi data sambungan
   - `isVerifiedByData = true`

4. **Survey Teknisi**

   - Teknisi melakukan survey lapangan
   - Upload data survey (foto jaringan, bak, meteran)
   - Teknisi memverifikasi connection data
   - `isVerifiedByTechnician = true`

5. **Pembuatan RAB**

   - Teknisi membuat RAB (Rencana Anggaran Biaya)
   - Upload dokumen RAB

6. **Pembayaran RAB**

   - User melakukan pembayaran RAB
   - `isPaid = true`

7. **Penyelesaian Prosedur**

   - Admin menyelesaikan semua prosedur
   - `isAllProcedureDone = true`
   - Admin membuat data meteran
   - Memasukkan kelompok pelanggan

8. **Update Otomatis User**
   - `SambunganDataId` terisi
   - `meteranId` terisi
   - `isVerified = true`

## 🖼️ File Upload

### Format File

- ✅ **Hanya PDF files** yang diterima (application/pdf)
- ✅ Maximum file size: **5MB per file**
- ✅ Upload menggunakan **multipart/form-data**

### File Fields

**Connection Data:**

- `nikFile` - PDF dokumen NIK
- `kkFile` - PDF dokumen Kartu Keluarga
- `imbFile` - PDF dokumen IMB

**Survey Data:**

- `jaringanFile` - PDF diagram jaringan
- `posisiBakFile` - PDF posisi bak air
- `posisiMeteranFile` - PDF posisi meteran

**RAB Connection:**

- `rabFile` - PDF dokumen RAB (Rencana Anggaran Biaya)

### Cloudinary Storage

Semua file otomatis diupload ke Cloudinary dengan struktur folder:

```
aqualink/
├── nik/           # NIK documents
├── kk/            # KK documents
├── imb/           # IMB documents
├── survey/
│   ├── jaringan/  # Network diagrams
│   ├── bak/       # Tank position docs
│   └── meteran/   # Meter position docs
└── rab/           # RAB documents
```

### Upload Example (JavaScript)

```javascript
const formData = new FormData();
formData.append("nik", "3201234567890123");
formData.append("nikFile", pdfFile); // File from input type="file"
formData.append("noKK", "3201234567890001");
formData.append("kkFile", kkPdfFile);
// ... other fields

const response = await fetch("http://localhost:5000/connection-data", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### Upload Example (cURL)

```bash
curl -X POST http://localhost:5000/connection-data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "nik=3201234567890123" \
  -F "nikFile=@/path/to/nik.pdf" \
  -F "noKK=3201234567890001" \
  -F "kkFile=@/path/to/kk.pdf" \
  -F "alamat=Jl. Merdeka No. 123" \
  -F "kecamatan=Bandung Wetan" \
  -F "kelurahan=Cihapit" \
  -F "noImb=IMB/2024/001" \
  -F "imbFile=@/path/to/imb.pdf" \
  -F "luasBangunan=100"
```

## 🛠️ Development

### Run in development mode

```bash
yarn start
```

### Database Models

#### ConnectionData

- Data sambungan user (NIK, KK, IMB, dll)
- Status verifikasi admin dan teknisi

#### SurveyData

- Data hasil survey lapangan
- Foto-foto lokasi
- Data teknis

#### RabConnection

- Rencana Anggaran Biaya
- Status pembayaran

#### Meteran

- Data meteran pelanggan
- Tracking pemakaian air
- Tagihan

#### KelompokPelanggan

- Kategori pelanggan
- Harga tarif air

## 📝 Notes

- Semua dokumen diupload ke Cloudinary dalam format **PDF**
- Maximum file size adalah **5MB** per file
- Menggunakan **multer** untuk handle multipart/form-data
- JWT token digunakan untuk authentication dengan expire 30 hari
- Password di-hash menggunakan bcryptjs
- MongoDB digunakan sebagai database dengan Mongoose ORM

## ⚙️ Dependencies

### Core

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables

### Authentication & Security

- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing

### File Upload

- `multer` - Multipart/form-data handling
- `cloudinary` - Cloud storage for PDF files

### Others

- `axios` - HTTP client
- `body-parser` - Request body parsing
- `date-fns` - Date manipulation
- `uuid` - Unique ID generation

## 👥 Contributors

- Rafli Afriza (@rafliafriza12)

## 📄 License

MIT License
