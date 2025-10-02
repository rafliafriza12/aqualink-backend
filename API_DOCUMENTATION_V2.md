# Aqualink Backend API Documentation

## Base URL

```
http://localhost:5000
```

## Authentication

Most endpoints require authentication using JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## File Upload

All file uploads use `multipart/form-data` format and accept **PDF files only**.

### File Size Limit

- Maximum file size: **5MB per file**

### Accepted File Types

- **PDF** (application/pdf)

---

## 1. Connection Data API

### Create Connection Data (User)

**POST** `/connection-data`

- **Auth**: User Token
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `nik` (string, required) - NIK number
  - `nikFile` (file, required) - PDF file of NIK
  - `noKK` (string, required) - KK number
  - `kkFile` (file, required) - PDF file of KK
  - `alamat` (string, required) - Address
  - `kecamatan` (string, required) - District
  - `kelurahan` (string, required) - Sub-district
  - `noImb` (string, required) - IMB number
  - `imbFile` (file, required) - PDF file of IMB
  - `luasBangunan` (number, required) - Building area in m²

**cURL Example**:

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

### Get My Connection Data

**GET** `/connection-data/my-connection`

- **Auth**: User Token

### Get All Connection Data (Admin)

**GET** `/connection-data`

- **Auth**: Admin Token
- **Query Params**:
  - `isVerifiedByData` (boolean) - Filter by admin verification
  - `isVerifiedByTechnician` (boolean) - Filter by technician verification
  - `isAllProcedureDone` (boolean) - Filter by completion status

### Get Connection Data by ID (Admin)

**GET** `/connection-data/:id`

- **Auth**: Admin Token

### Verify Connection Data by Admin

**PUT** `/connection-data/:id/verify-admin`

- **Auth**: Admin Token

### Verify Connection Data by Technician

**PUT** `/connection-data/:id/verify-technician`

- **Auth**: Technician Token

### Complete All Procedure (Admin)

**PUT** `/connection-data/:id/complete-procedure`

- **Auth**: Admin Token
- **Note**: RAB must be paid first

### Update Connection Data (Admin)

**PUT** `/connection-data/:id`

- **Auth**: Admin Token
- **Content-Type**: `multipart/form-data`
- **Form Fields** (all optional):
  - `nik` (string)
  - `nikFile` (file) - PDF file
  - `noKK` (string)
  - `kkFile` (file) - PDF file
  - `alamat` (string)
  - `kecamatan` (string)
  - `kelurahan` (string)
  - `noImb` (string)
  - `imbFile` (file) - PDF file
  - `luasBangunan` (number)

### Delete Connection Data (Admin)

**DELETE** `/connection-data/:id`

- **Auth**: Admin Token

---

## 2. Survey Data API

### Create Survey Data (Technician)

**POST** `/survey-data`

- **Auth**: Technician Token
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `connectionDataId` (string, required) - Connection data ID
  - `jaringanFile` (file, required) - PDF file of network diagram
  - `diameterPipa` (number, required) - Pipe diameter in inches
  - `posisiBakFile` (file, required) - PDF file of tank position
  - `posisiMeteranFile` (file, required) - PDF file of meter position
  - `jumlahPenghuni` (number, required) - Number of residents
  - `koordinatLat` (number, required) - Latitude coordinate
  - `koordinatLong` (number, required) - Longitude coordinate
  - `standar` (boolean, required) - Is standard installation

**cURL Example**:

```bash
curl -X POST http://localhost:5000/survey-data \
  -H "Authorization: Bearer YOUR_TECHNICIAN_TOKEN" \
  -F "connectionDataId=65a1b2c3d4e5f6g7h8i9j0k1" \
  -F "jaringanFile=@/path/to/jaringan.pdf" \
  -F "diameterPipa=3" \
  -F "posisiBakFile=@/path/to/posisi_bak.pdf" \
  -F "posisiMeteranFile=@/path/to/posisi_meteran.pdf" \
  -F "jumlahPenghuni=5" \
  -F "koordinatLat=-6.914744" \
  -F "koordinatLong=107.609810" \
  -F "standar=true"
```

### Get All Survey Data (Admin)

**GET** `/survey-data`

- **Auth**: Admin Token

### Get Survey Data by ID (Admin)

**GET** `/survey-data/:id`

- **Auth**: Admin Token

### Get Survey Data by Connection ID (Admin)

**GET** `/survey-data/connection/:connectionDataId`

- **Auth**: Admin Token

### Update Survey Data (Technician)

**PUT** `/survey-data/:id`

- **Auth**: Technician Token
- **Content-Type**: `multipart/form-data`
- **Form Fields** (all optional):
  - `jaringanFile` (file) - PDF file
  - `diameterPipa` (number)
  - `posisiBakFile` (file) - PDF file
  - `posisiMeteranFile` (file) - PDF file
  - `jumlahPenghuni` (number)
  - `koordinatLat` (number)
  - `koordinatLong` (number)
  - `standar` (boolean)

### Delete Survey Data (Admin)

**DELETE** `/survey-data/:id`

- **Auth**: Admin Token

---

## 3. RAB Connection API

### Create RAB Connection (Technician)

**POST** `/rab-connection`

- **Auth**: Technician Token
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `connectionDataId` (string, required) - Connection data ID
  - `totalBiaya` (number, required) - Total cost in IDR
  - `rabFile` (file, required) - PDF file of RAB document

**cURL Example**:

```bash
curl -X POST http://localhost:5000/rab-connection \
  -H "Authorization: Bearer YOUR_TECHNICIAN_TOKEN" \
  -F "connectionDataId=65a1b2c3d4e5f6g7h8i9j0k1" \
  -F "totalBiaya=5000000" \
  -F "rabFile=@/path/to/rab.pdf"
```

### Get My RAB Connection (User)

**GET** `/rab-connection/my-rab`

- **Auth**: User Token

### Get All RAB Connections (Admin)

**GET** `/rab-connection`

- **Auth**: Admin Token
- **Query Params**:
  - `isPaid` (boolean) - Filter by payment status

### Get RAB Connection by ID (Admin)

**GET** `/rab-connection/:id`

- **Auth**: Admin Token

### Get RAB Connection by Connection ID (Admin)

**GET** `/rab-connection/connection/:connectionDataId`

- **Auth**: Admin Token

### Update RAB Payment Status (User/Admin)

**PUT** `/rab-connection/:id/payment`

- **Auth**: User Token
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "isPaid": true
}
```

### Update RAB Connection (Technician)

**PUT** `/rab-connection/:id`

- **Auth**: Technician Token
- **Content-Type**: `multipart/form-data`
- **Form Fields** (all optional):
  - `totalBiaya` (number)
  - `rabFile` (file) - PDF file

### Delete RAB Connection (Admin)

**DELETE** `/rab-connection/:id`

- **Auth**: Admin Token

---

## 4. Meteran API

### Create Meteran (Admin)

**POST** `/meteran`

- **Auth**: Admin Token
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "noMeteran": "MTR2024001",
  "kelompokPelangganId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "userId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "connectionDataId": "65a1b2c3d4e5f6g7h8i9j0k3",
  "totalPemakaian": 0,
  "pemakaianBelumTerbayar": 0,
  "jatuhTempo": null
}
```

### Get My Meteran (User)

**GET** `/meteran/my-meteran`

- **Auth**: User Token

### Get All Meteran (Admin)

**GET** `/meteran`

- **Auth**: Admin Token

### Get Meteran by ID (Admin)

**GET** `/meteran/:id`

- **Auth**: Admin Token

### Update Meteran (Admin)

**PUT** `/meteran/:id`

- **Auth**: Admin Token
- **Content-Type**: `application/json`

### Delete Meteran (Admin)

**DELETE** `/meteran/:id`

- **Auth**: Admin Token

---

## 5. Kelompok Pelanggan API

### Create Kelompok Pelanggan (Admin)

**POST** `/kelompok-pelanggan`

- **Auth**: Admin Token
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "namaKelompok": "Rumah Tangga",
  "hargaPenggunaanDibawah10": 5000,
  "hargaPenggunaanDiatas10": 7000,
  "biayaBeban": 10000
}
```

### Get All Kelompok Pelanggan (Admin)

**GET** `/kelompok-pelanggan`

- **Auth**: Admin Token

### Get Kelompok Pelanggan by ID (Admin)

**GET** `/kelompok-pelanggan/:id`

- **Auth**: Admin Token

### Update Kelompok Pelanggan (Admin)

**PUT** `/kelompok-pelanggan/:id`

- **Auth**: Admin Token
- **Content-Type**: `application/json`

### Delete Kelompok Pelanggan (Admin)

**DELETE** `/kelompok-pelanggan/:id`

- **Auth**: Admin Token

---

## 6. Technician API

### Login Technician

**POST** `/technician/login`

- **Content-Type**: `application/json`
- **Body**:

```json
{
  "email": "teknisi@pdam.com",
  "password": "password123"
}
```

### Get Technician Profile

**GET** `/technician/profile`

- **Auth**: Technician Token

### Logout Technician

**POST** `/technician/logout`

- **Auth**: Technician Token

### Create Technician (Admin)

**POST** `/technician`

- **Auth**: Admin Token
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "fullName": "Teknisi Lapangan",
  "email": "teknisi@pdam.com",
  "password": "password123",
  "phone": "081234567890"
}
```

### Get All Technicians (Admin)

**GET** `/technician`

- **Auth**: Admin Token

### Get Technician by ID (Admin)

**GET** `/technician/:id`

- **Auth**: Admin Token

### Update Technician (Admin)

**PUT** `/technician/:id`

- **Auth**: Admin Token
- **Content-Type**: `application/json`

### Delete Technician (Admin)

**DELETE** `/technician/:id`

- **Auth**: Admin Token

---

## Response Format

### Success Response

```json
{
  "status": 200,
  "message": "Success message",
  "data": {}
}
```

### Error Response

```json
{
  "status": 400,
  "message": "Error message"
}
```

---

## File Upload using Postman/Thunder Client

### 1. Set Request Type to POST/PUT

### 2. Add Authorization Header

```
Authorization: Bearer YOUR_TOKEN
```

### 3. Select Body Tab

- Select **form-data** (NOT raw, NOT x-www-form-urlencoded)

### 4. Add Form Fields

For text fields:

- Key: `nik`
- Value: `3201234567890123`
- Type: Text

For file fields:

- Key: `nikFile`
- Value: Click "Select Files" and choose PDF file
- Type: File

### 5. Send Request

---

## File Upload using JavaScript/Axios

```javascript
const formData = new FormData();
formData.append("nik", "3201234567890123");
formData.append("nikFile", pdfFile); // File object from input type="file"
formData.append("noKK", "3201234567890001");
formData.append("kkFile", kkFile);
// ... add other fields

const response = await axios.post(
  "http://localhost:5000/connection-data",
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);
```

---

## File Upload using React/Next.js

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("nik", nik);
  formData.append("nikFile", nikFile); // From: <input type="file" onChange={(e) => setNikFile(e.target.files[0])} />
  formData.append("noKK", noKK);
  formData.append("kkFile", kkFile);
  // ... add other fields

  try {
    const response = await fetch("http://localhost:5000/connection-data", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
};
```

---

## Workflow

1. **User Registration & Login** → Get USER_TOKEN
2. **Admin Create Technician** → Technician can login
3. **Technician Login** → Get TECHNICIAN_TOKEN
4. **Admin Create Kelompok Pelanggan** → Define customer groups
5. **User Upload Connection Data** → Upload NIK, KK, IMB PDFs
6. **Admin Verify Connection Data** → Approve user's documents
7. **Technician Survey & Upload** → Upload survey PDFs (jaringan, bak, meteran)
8. **Technician Verify Connection** → Approve connection technically
9. **Technician Create RAB** → Upload RAB PDF document
10. **User Pay RAB** → Update payment status
11. **Admin Complete Procedure** → Mark as done
12. **Admin Create Meteran** → Assign meter to user
13. **Auto Update User** → User gets verified with meter and connection data
14. **IoT Device Sends Usage Data** → Real-time water usage tracking (per second)

---

## 8. History Usage API (IoT Time-Series Data)

### Overview

History Usage adalah data time-series mentah dari sensor IoT yang mencatat pemakaian air per detik. Setiap kali sensor mendeteksi aliran air, IoT device mengirim data `usedWater` (dalam liter) ke endpoint ini.

**Model Structure:**

```javascript
{
  userId: ObjectId,
  meteranId: ObjectId,
  usedWater: Number,  // Liter per detik dari sensor IoT
  createdAt: Date     // Auto timestamp
}
```

### Create History Usage (IoT Device)

**POST** `/history/:userId/:meteranId`

- **Auth**: None (public endpoint untuk IoT device)
- **Content-Type**: `application/json`
- **URL Params**:
  - `userId` (string, required) - User ID pemilik meteran
  - `meteranId` (string, required) - Meteran ID sensor IoT
- **Body**:
  - `usedWater` (number, required) - Jumlah air yang melewati sensor (liter)

**Description**: Endpoint ini digunakan oleh IoT device untuk mengirim data pemakaian air secara real-time. Data dikirim setiap kali ada air yang melewati sensor (bisa per detik atau per menit tergantung konfigurasi IoT).

**cURL Example**:

```bash
curl -X POST http://localhost:5000/history/60d5ec49f1b2c72b8c8e4f1a/60d5ec49f1b2c72b8c8e4f1b \
  -H "Content-Type: application/json" \
  -d '{
    "usedWater": 1.3
  }'
```

**Arduino/ESP32 Example**:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverName = "http://192.168.1.100:5000/history/USER_ID/METERAN_ID";

void sendWaterUsage(float liters) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"usedWater\":" + String(liters) + "}";
    int httpResponseCode = http.POST(payload);

    if(httpResponseCode > 0) {
      Serial.println("Data sent successfully");
    }
    http.end();
  }
}

void loop() {
  float waterUsed = readFlowSensor(); // Baca dari sensor flow
  if(waterUsed > 0) {
    sendWaterUsage(waterUsed);
  }
  delay(1000); // Kirim setiap detik
}
```

**Response**:

```json
{
  "status": 201,
  "message": "Data pemakaian air berhasil disimpan",
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1c",
    "userId": "60d5ec49f1b2c72b8c8e4f1a",
    "meteranId": "60d5ec49f1b2c72b8c8e4f1b",
    "usedWater": 1.3,
    "createdAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### Get History Usage with Time Filter

**GET** `/history/getHistory/:userId/:meteranId?filter=hari`

- **Auth**: None (public)
- **URL Params**:
  - `userId` (string, required) - User ID
  - `meteranId` (string, required) - Meteran ID
- **Query Params**:
  - `filter` (string, optional) - Time filter: `hari` | `minggu` | `bulan` | `tahun` (default: `hari`)

**Description**: Menampilkan data pemakaian air yang sudah diagregasi berdasarkan filter waktu. Data ditampilkan dalam bentuk grafik-friendly dengan total pemakaian per periode.

**Filter Options:**

- `hari` - Data per jam (00:00, 01:00, ..., 23:00) untuk hari ini
- `minggu` - Data per hari (Senin, Selasa, ..., Minggu) untuk minggu ini
- `bulan` - Data per minggu (Minggu ke-1, ke-2, ...) untuk bulan ini
- `tahun` - Data per bulan (Januari, Februari, ..., Desember) untuk tahun ini

**cURL Example**:

```bash
# Data per jam hari ini
curl -X GET "http://localhost:5000/history/getHistory/60d5ec49f1b2c72b8c8e4f1a/60d5ec49f1b2c72b8c8e4f1b?filter=hari"

# Data per hari minggu ini
curl -X GET "http://localhost:5000/history/getHistory/60d5ec49f1b2c72b8c8e4f1a/60d5ec49f1b2c72b8c8e4f1b?filter=minggu"

# Data per minggu bulan ini
curl -X GET "http://localhost:5000/history/getHistory/60d5ec49f1b2c72b8c8e4f1a/60d5ec49f1b2c72b8c8e4f1b?filter=bulan"

# Data per bulan tahun ini
curl -X GET "http://localhost:5000/history/getHistory/60d5ec49f1b2c72b8c8e4f1a/60d5ec49f1b2c72b8c8e4f1b?filter=tahun"
```

**Response Example (filter=hari)**:

```json
{
  "status": 200,
  "filter": "hari",
  "data": [
    {
      "_id": { "time": "08:00" },
      "totalUsedWater": 45.5
    },
    {
      "_id": { "time": "09:00" },
      "totalUsedWater": 78.2
    },
    {
      "_id": { "time": "10:00" },
      "totalUsedWater": 62.1
    }
  ],
  "notification": null,
  "totalUsageToday": 523.8
}
```

**Response Example (filter=minggu)**:

```json
{
  "status": 200,
  "filter": "minggu",
  "data": [
    {
      "_id": { "day": "Senin" },
      "totalUsedWater": 450.5
    },
    {
      "_id": { "day": "Selasa" },
      "totalUsedWater": 523.8
    },
    {
      "_id": { "day": "Rabu" },
      "totalUsedWater": 0
    }
  ],
  "notification": null,
  "totalUsageToday": 523.8
}
```

**High Usage Warning**: Jika pemakaian air hari ini ≥ 500 liter, sistem otomatis membuat notifikasi peringatan.

### Get All History Usage (Admin)

**GET** `/history/all`

- **Auth**: Admin Token
- **Query Params**:
  - `userId` (string, optional) - Filter by user ID
  - `meteranId` (string, optional) - Filter by meteran ID
  - `startDate` (string, optional) - Filter start date (ISO format)
  - `endDate` (string, optional) - Filter end date (ISO format)
  - `limit` (number, optional) - Limit results (default: all)

**Description**: Menampilkan data mentah (raw data) dari history usage untuk keperluan analisis atau debugging.

**cURL Example**:

```bash
# Semua data
curl -X GET "http://localhost:5000/history/all" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by meteran, last 100 records
curl -X GET "http://localhost:5000/history/all?meteranId=60d5ec49f1b2c72b8c8e4f1b&limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by date range
curl -X GET "http://localhost:5000/history/all?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response**:

```json
{
  "status": 200,
  "count": 1523,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1c",
      "userId": {
        "_id": "60d5ec49f1b2c72b8c8e4f1a",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "meteranId": {
        "_id": "60d5ec49f1b2c72b8c8e4f1b",
        "nomorMeteran": "MTR-001"
      },
      "usedWater": 1.3,
      "createdAt": "2024-01-15T10:30:45.123Z"
    }
  ]
}
```

### Delete History Usage (Admin)

**DELETE** `/history/:id`

- **Auth**: Admin Token

**cURL Example**:

```bash
curl -X DELETE http://localhost:5000/history/60d5ec49f1b2c72b8c8e4f1c \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## IoT Integration Guide

### Hardware Requirements

- ESP32 / ESP8266 / Arduino with WiFi module
- Water flow sensor (e.g., YF-S201, G1/2")
- Power supply (5V for sensor, 3.3V for ESP32)

### Flow Sensor Connection

```
Sensor VCC → 5V
Sensor GND → GND
Sensor Signal → GPIO Pin (e.g., D2)
```

### Sample Code Flow Calculation

```cpp
volatile int flowPulseCount;
float calibrationFactor = 4.5; // Pulses per liter (tergantung sensor)

void IRAM_ATTR pulseCounter() {
  flowPulseCount++;
}

void setup() {
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), pulseCounter, FALLING);
}

void loop() {
  flowPulseCount = 0;
  interrupts();
  delay(1000); // Hitung per detik
  noInterrupts();

  float flowRate = flowPulseCount / calibrationFactor; // Liter per detik

  if(flowRate > 0) {
    sendWaterUsage(flowRate);
  }
}
```

### Data Sending Strategy

**Option 1: Real-time (Recommended for low usage)**

```cpp
// Kirim setiap kali ada air mengalir
if(flowRate > 0) {
  sendWaterUsage(flowRate);
  delay(1000);
}
```

**Option 2: Batch (Recommended for high frequency)**

```cpp
// Akumulasi 10 detik, kirim total
float totalLiters = 0;
for(int i = 0; i < 10; i++) {
  totalLiters += readFlowRate();
  delay(1000);
}
if(totalLiters > 0) {
  sendWaterUsage(totalLiters);
}
```

---

## 9. Billing API (Automatic Monthly Billing) 🔥

**Complete documentation**: See [BILLING_DOCUMENTATION.md](./BILLING_DOCUMENTATION.md)

### Overview

Sistem billing otomatis yang generate tagihan setiap tanggal 1 setiap bulan, mengirim reminder, dan mengelola denda keterlambatan.

**Key Features**:

- ✅ Auto-generate billing setiap tanggal 1 (Cron Job)
- ✅ Auto-update overdue status setiap hari
- ✅ Auto-send reminder 3 hari sebelum jatuh tempo
- ✅ Kalkulasi denda 2% per bulan keterlambatan
- ✅ **Reset `meteran.pemakaianBelumTerbayar = 0` saat bayar** ⭐

### Generate Billing for All Meters (Admin)

**POST** `/billing/generate-all`

- **Auth**: Admin Token
- **Body** (Optional):
  - `periode` (string) - Format: YYYY-MM (default: current month)

**cURL Example**:

```bash
curl -X POST http://localhost:5000/billing/generate-all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get My Billing (User)

**GET** `/billing/my-billing`

- **Auth**: User Token

**cURL Example**:

```bash
curl -X GET http://localhost:5000/billing/my-billing \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Get Unpaid Billing (User)

**GET** `/billing/unpaid`

- **Auth**: User Token
- **Returns**: Unpaid bills dengan kalkulasi denda

**cURL Example**:

```bash
curl -X GET http://localhost:5000/billing/unpaid \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Response Example**:

```json
{
  "status": 200,
  "data": {
    "bills": [
      {
        "periode": "2024-01",
        "totalTagihan": 135000,
        "daysLate": 5,
        "denda": 2700,
        "totalWithDenda": 137700
      }
    ],
    "totalUnpaid": 137700,
    "count": 1
  }
}
```

### Pay Billing (User) - Manual Payment ⭐

**PUT** `/billing/:id/pay`

- **Auth**: User Token
- **Body**:
  - `paymentMethod` (string, optional) - "MANUAL", "TRANSFER", "EWALLET"

**Important**: Setelah pembayaran, `meteran.pemakaianBelumTerbayar` akan **reset menjadi 0**.

**cURL Example**:

```bash
curl -X PUT http://localhost:5000/billing/:id/pay \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "TRANSFER"}'
```

### Create Midtrans Payment (User) 🔥

**POST** `/billing/:id/create-payment`

- **Auth**: User Token
- **No Body Required**

**Response**:

```json
{
  "status": 201,
  "message": "Payment link berhasil dibuat",
  "data": {
    "orderId": "BILL-673fkl890abcdef123456789-1705987200000",
    "token": "66e4fa55-fdac-4ef9-91b5-733b5d859229",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "billing": {
      "periode": "2024-01",
      "biayaAir": 88500,
      "biayaBeban": 20000,
      "denda": 2170,
      "totalAmount": 110670
    }
  }
}
```

**cURL Example**:

```bash
curl -X POST http://localhost:5000/billing/60d5ec49f1b2c72b8c8e4f1a/create-payment \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json"
```

**Frontend Integration**:

```javascript
// User clicks "Pay with Midtrans"
const response = await fetch("/billing/BILLING_ID/create-payment", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + userToken,
  },
});

const data = await response.json();

// Open Midtrans Snap popup
snap.pay(data.data.token, {
  onSuccess: function (result) {
    console.log("Payment success", result);
    alert("Pembayaran berhasil! Silakan cek billing Anda.");
  },
  onPending: function (result) {
    console.log("Payment pending", result);
    alert("Pembayaran sedang diproses...");
  },
  onError: function (result) {
    console.log("Payment error", result);
    alert("Pembayaran gagal. Silakan coba lagi.");
  },
  onClose: function () {
    console.log("Payment popup closed");
  },
});
```

### Midtrans Webhook Handler (Internal) 🤖

**POST** `/billing/webhook`

- **Auth**: None (called by Midtrans)
- **Body**: Midtrans notification payload

**What it does**:

1. Verify signature using SHA512
2. Find transaction by `order_id`
3. Handle transaction status:
   - `settlement` or `capture` + `fraud_status=accept`: Update billing to paid, **reset meteran.pemakaianBelumTerbayar = 0**, send notification
   - `pending`: Update transaction status only
   - `cancel`/`deny`/`expire`: Mark as failed, send notification
4. Return 200 OK to Midtrans

**Important**: This endpoint is automatically called by Midtrans after payment. You don't need to call it manually.

**Console Output**:

```
📨 Webhook received: { order_id: 'BILL-...', transaction_status: 'settlement', ... }
✅ Payment settled: BILL-673fkl890abcdef123456789-1705987200000
```

### Get Monthly Report (Admin)

**GET** `/billing/report/:periode`

- **Auth**: Admin Token
- **Params**: `periode` - Format: YYYY-MM

**cURL Example**:

```bash
curl -X GET http://localhost:5000/billing/report/2024-01 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response**:

```json
{
  "status": 200,
  "data": {
    "periode": "2024-01",
    "summary": {
      "totalPelanggan": 150,
      "totalPemakaian": 3750,
      "totalTagihan": 18750000,
      "totalPaid": 15000000,
      "totalUnpaid": 3750000,
      "totalDenda": 75000
    }
  }
}
```

### Cron Jobs Schedule

| Job              | Schedule      | Description                   |
| ---------------- | ------------- | ----------------------------- |
| Generate Billing | 1st @ 00:01   | Auto-generate monthly billing |
| Check Overdue    | Daily @ 00:05 | Update overdue status         |
| Send Reminder    | Daily @ 08:00 | Reminder 3 days before due    |

---

## Important Notes

1. ✅ All uploaded files MUST be in **PDF format**
2. ✅ Maximum file size is **5MB**
3. ✅ Use **multipart/form-data** for file uploads
4. ✅ File fields use `File` type in form-data, not `Text`
5. ✅ Files are automatically uploaded to Cloudinary
6. ✅ Cloudinary URLs are stored in database
7. ✅ Each workflow step has validation checks
8. ✅ **IoT endpoint** is public (no authentication required)
9. ✅ **History Usage** automatically updates `meteran.totalPemakaian`
10. ✅ **High usage warning** notification sent when usage ≥ 500L/day
11. ✅ **Billing auto-generated** setiap tanggal 1 via cron job
12. ✅ **pemakaianBelumTerbayar reset to 0** setelah pembayaran sukses
13. ✅ **Denda 2% per bulan** untuk keterlambatan pembayaran
14. ✅ **Midtrans integration** for online payment (GoPay, Bank Transfer, Credit Card, etc.)
15. ✅ **Webhook automatic** updates payment status from Midtrans
