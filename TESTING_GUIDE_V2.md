# Testing Guide - Aqualink Backend (PDF Upload)

## Prerequisites

- Postman or Thunder Client installed
- PDF files ready for testing (< 5MB each)
- Server running on http://localhost:5000

## Setup Environment Variables in Postman

Create environment with these variables:

```
BASE_URL = http://localhost:5000
USER_TOKEN = (will be set after login)
ADMIN_TOKEN = (will be set after admin login)
TECHNICIAN_TOKEN = (will be set after technician login)
CONNECTION_ID = (will be set after creating connection)
KELOMPOK_ID = (will be set after creating kelompok)
USER_ID = (will be set after user registration)
```

---

## Complete Testing Flow

### 1️⃣ Admin Registration (First Time Setup)

```
POST {{BASE_URL}}/admin/auth/register
Content-Type: application/json

Body (raw JSON):
{
  "fullName": "Admin PDAM",
  "email": "admin@pdam.com",
  "password": "admin123",
  "phone": "081234567890"
}

✅ Save admin ID for later use
```

---

### 2️⃣ Admin Login

```
POST {{BASE_URL}}/admin/auth/login
Content-Type: application/json

Body (raw JSON):
{
  "email": "admin@pdam.com",
  "password": "admin123"
}

✅ Copy the token from response
✅ Save as ADMIN_TOKEN in environment
```

---

### 3️⃣ Create Technician (Admin)

```
POST {{BASE_URL}}/technician
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

Body (raw JSON):
{
  "fullName": "Teknisi Lapangan",
  "email": "teknisi@pdam.com",
  "password": "teknisi123",
  "phone": "081234567891"
}
```

---

### 4️⃣ Technician Login

```
POST {{BASE_URL}}/technician/login
Content-Type: application/json

Body (raw JSON):
{
  "email": "teknisi@pdam.com",
  "password": "teknisi123"
}

✅ Copy the token from response
✅ Save as TECHNICIAN_TOKEN in environment
```

---

### 5️⃣ User Registration

```
POST {{BASE_URL}}/users/register
Content-Type: application/json

Body (raw JSON):
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "081234567892"
}

✅ Save user ID as USER_ID
```

---

### 6️⃣ User Login

```
POST {{BASE_URL}}/users/login
Content-Type: application/json

Body (raw JSON):
{
  "email": "john@example.com",
  "password": "password123"
}

✅ Copy the token from response
✅ Save as USER_TOKEN in environment
```

---

### 7️⃣ Create Kelompok Pelanggan (Admin)

```
POST {{BASE_URL}}/kelompok-pelanggan
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

Body (raw JSON):
{
  "namaKelompok": "Rumah Tangga",
  "hargaPenggunaanDibawah10": 5000,
  "hargaPenggunaanDiatas10": 7000,
  "biayaBeban": 10000
}

✅ Save the ID as KELOMPOK_ID
```

---

### 8️⃣ Create Connection Data (User) - WITH PDF UPLOAD

```
POST {{BASE_URL}}/connection-data
Authorization: Bearer {{USER_TOKEN}}
Content-Type: multipart/form-data

⚠️ IMPORTANT: In Postman, select "Body" → "form-data"

Form Data Fields:
┌──────────────────┬───────────────────────┬────────┐
│ Key              │ Value                 │ Type   │
├──────────────────┼───────────────────────┼────────┤
│ nik              │ 3201234567890123      │ Text   │
│ nikFile          │ [Select PDF File]     │ File   │
│ noKK             │ 3201234567890001      │ Text   │
│ kkFile           │ [Select PDF File]     │ File   │
│ alamat           │ Jl. Merdeka No. 123   │ Text   │
│ kecamatan        │ Bandung Wetan         │ Text   │
│ kelurahan        │ Cihapit               │ Text   │
│ noImb            │ IMB/2024/001          │ Text   │
│ imbFile          │ [Select PDF File]     │ File   │
│ luasBangunan     │ 100                   │ Text   │
└──────────────────┴───────────────────────┴────────┘

✅ Save the ID as CONNECTION_ID
✅ Verify that nikUrl, kkUrl, imbUrl contain Cloudinary URLs
```

**How to add files in Postman:**

1. Click on "Body" tab
2. Select "form-data"
3. For file fields:
   - Type the key name (e.g., `nikFile`)
   - Hover over the right side, change dropdown from "Text" to "File"
   - Click "Select Files" button
   - Choose your PDF file

---

### 9️⃣ Get All Connection Data (Admin)

```
GET {{BASE_URL}}/connection-data
Authorization: Bearer {{ADMIN_TOKEN}}

Optional Query Parameters:
?isVerifiedByData=false
?isVerifiedByTechnician=false
?isAllProcedureDone=false
```

---

### 🔟 Verify Connection Data by Admin

```
PUT {{BASE_URL}}/connection-data/{{CONNECTION_ID}}/verify-admin
Authorization: Bearer {{ADMIN_TOKEN}}

✅ Check that isVerifiedByData = true in response
```

---

### 1️⃣1️⃣ Create Survey Data (Technician) - WITH PDF UPLOAD

```
POST {{BASE_URL}}/survey-data
Authorization: Bearer {{TECHNICIAN_TOKEN}}
Content-Type: multipart/form-data

⚠️ IMPORTANT: In Postman, select "Body" → "form-data"

Form Data Fields:
┌────────────────────┬──────────────────────┬────────┐
│ Key                │ Value                │ Type   │
├────────────────────┼──────────────────────┼────────┤
│ connectionDataId   │ {{CONNECTION_ID}}    │ Text   │
│ jaringanFile       │ [Select PDF File]    │ File   │
│ diameterPipa       │ 3                    │ Text   │
│ posisiBakFile      │ [Select PDF File]    │ File   │
│ posisiMeteranFile  │ [Select PDF File]    │ File   │
│ jumlahPenghuni     │ 5                    │ Text   │
│ koordinatLat       │ -6.914744            │ Text   │
│ koordinatLong      │ 107.609810           │ Text   │
│ standar            │ true                 │ Text   │
└────────────────────┴──────────────────────┴────────┘

✅ Save the ID as SURVEY_ID
✅ Verify that jaringanUrl, posisiBakUrl, posisiMeteranUrl contain Cloudinary URLs
```

---

### 1️⃣2️⃣ Verify Connection Data by Technician

```
PUT {{BASE_URL}}/connection-data/{{CONNECTION_ID}}/verify-technician
Authorization: Bearer {{TECHNICIAN_TOKEN}}

✅ Check that isVerifiedByTechnician = true
```

---

### 1️⃣3️⃣ Create RAB Connection (Technician) - WITH PDF UPLOAD

```
POST {{BASE_URL}}/rab-connection
Authorization: Bearer {{TECHNICIAN_TOKEN}}
Content-Type: multipart/form-data

⚠️ IMPORTANT: In Postman, select "Body" → "form-data"

Form Data Fields:
┌────────────────────┬──────────────────────┬────────┐
│ Key                │ Value                │ Type   │
├────────────────────┼──────────────────────┼────────┤
│ connectionDataId   │ {{CONNECTION_ID}}    │ Text   │
│ totalBiaya         │ 5000000              │ Text   │
│ rabFile            │ [Select PDF File]    │ File   │
└────────────────────┴──────────────────────┴────────┘

✅ Save the ID as RAB_ID
✅ Verify that rabUrl contains Cloudinary URL
```

---

### 1️⃣4️⃣ Get My RAB Connection (User)

```
GET {{BASE_URL}}/rab-connection/my-rab
Authorization: Bearer {{USER_TOKEN}}

✅ Check RAB details and isPaid status
```

---

### 1️⃣5️⃣ Update RAB Payment Status (User)

```
PUT {{BASE_URL}}/rab-connection/{{RAB_ID}}/payment
Authorization: Bearer {{USER_TOKEN}}
Content-Type: application/json

Body (raw JSON):
{
  "isPaid": true
}

✅ Check that isPaid = true
```

---

### 1️⃣6️⃣ Complete All Procedure (Admin)

```
PUT {{BASE_URL}}/connection-data/{{CONNECTION_ID}}/complete-procedure
Authorization: Bearer {{ADMIN_TOKEN}}

✅ Check that isAllProcedureDone = true
```

---

### 1️⃣7️⃣ Create Meteran (Admin)

```
POST {{BASE_URL}}/meteran
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

Body (raw JSON):
{
  "noMeteran": "MTR2024001",
  "kelompokPelangganId": "{{KELOMPOK_ID}}",
  "userId": "{{USER_ID}}",
  "connectionDataId": "{{CONNECTION_ID}}",
  "totalPemakaian": 0,
  "pemakaianBelumTerbayar": 0,
  "jatuhTempo": null
}

✅ This will automatically update User:
   - meteranId will be set
   - SambunganDataId will be set
   - isVerified will be true
```

---

### 1️⃣8️⃣ Get My Meteran (User)

```
GET {{BASE_URL}}/meteran/my-meteran
Authorization: Bearer {{USER_TOKEN}}

✅ Verify meteran details with kelompok pelanggan
```

---

### 1️⃣9️⃣ Verify User Status (User)

```
GET {{BASE_URL}}/users/profile
Authorization: Bearer {{USER_TOKEN}}

✅ Check that:
   - isVerified = true
   - SambunganDataId is set
   - meteranId is set
```

---

## Sample PDF Files for Testing

You can create simple PDF files or download sample PDFs from:

- https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
- https://www.africau.edu/images/default/sample.pdf

Or create your own using:

- Word/LibreOffice → Save as PDF
- Online converter: https://www.ilovepdf.com/

---

## Common Issues & Solutions

### ❌ Error: "Invalid file type. Only PDF files are allowed."

**Solution**: Make sure you're uploading PDF files, not images or other formats.

### ❌ Error: "All PDF files are required"

**Solution**: Make sure all required file fields are filled:

- Connection Data: nikFile, kkFile, imbFile
- Survey Data: jaringanFile, posisiBakFile, posisiMeteranFile
- RAB: rabFile

### ❌ Error: "File too large"

**Solution**: Compress your PDF to under 5MB using online tools like:

- https://www.ilovepdf.com/compress_pdf
- https://smallpdf.com/compress-pdf

### ❌ Error: 401 Unauthorized

**Solution**: Token expired or not provided. Login again to get new token.

### ❌ Error: 403 Forbidden

**Solution**: Using wrong token type (e.g., user token for admin endpoint).

### ❌ Postman shows "text" instead of "file" option

**Solution**:

1. Make sure you're in "form-data" (NOT raw or x-www-form-urlencoded)
2. Hover over the right side of the value field
3. Click the dropdown that appears
4. Select "File"

---

## Expected Final Results

After completing all steps successfully:

### User Object

```json
{
  "isVerified": true,
  "SambunganDataId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "meteranId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "email": "john@example.com",
  "fullName": "John Doe"
}
```

### Connection Data

```json
{
  "isVerifiedByData": true,
  "isVerifiedByTechnician": true,
  "isAllProcedureDone": true,
  "nikUrl": "https://res.cloudinary.com/dy76yigwi/...",
  "kkUrl": "https://res.cloudinary.com/dy76yigwi/...",
  "imbUrl": "https://res.cloudinary.com/dy76yigwi/..."
}
```

### Survey Data

```json
{
  "jaringanUrl": "https://res.cloudinary.com/dy76yigwi/...",
  "posisiBakUrl": "https://res.cloudinary.com/dy76yigwi/...",
  "posisiMeteranUrl": "https://res.cloudinary.com/dy76yigwi/..."
}
```

### RAB Connection

```json
{
  "isPaid": true,
  "rabUrl": "https://res.cloudinary.com/dy76yigwi/...",
  "totalBiaya": 5000000
}
```

---

## cURL Examples

### Upload Connection Data

```bash
curl -X POST http://localhost:5000/connection-data \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
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

### Upload Survey Data

```bash
curl -X POST http://localhost:5000/survey-data \
  -H "Authorization: Bearer YOUR_TECHNICIAN_TOKEN" \
  -F "connectionDataId=65a1b2c3d4e5f6g7h8i9j0k1" \
  -F "jaringanFile=@/path/to/jaringan.pdf" \
  -F "diameterPipa=3" \
  -F "posisiBakFile=@/path/to/bak.pdf" \
  -F "posisiMeteranFile=@/path/to/meteran.pdf" \
  -F "jumlahPenghuni=5" \
  -F "koordinatLat=-6.914744" \
  -F "koordinatLong=107.609810" \
  -F "standar=true"
```

### Upload RAB

```bash
curl -X POST http://localhost:5000/rab-connection \
  -H "Authorization: Bearer YOUR_TECHNICIAN_TOKEN" \
  -F "connectionDataId=65a1b2c3d4e5f6g7h8i9j0k1" \
  -F "totalBiaya=5000000" \
  -F "rabFile=@/path/to/rab.pdf"
```

---

## Checklist

Before testing, make sure:

- [ ] Server is running
- [ ] MongoDB is connected
- [ ] Cloudinary credentials are set in .env
- [ ] You have PDF files ready (< 5MB)
- [ ] Postman/Thunder Client is installed
- [ ] Environment variables are configured

Happy Testing! 🚀
