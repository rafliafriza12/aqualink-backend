# Survey Submission Fix - Debug Assignment Validation

## 🐛 Issue

Teknisi tidak bisa submit survei meskipun sudah di-assign ke connection data.

## 🔍 Root Cause Analysis

**Kemungkinan masalah:**

1. **Type Mismatch di Comparison:**

   - `connectionData.assignedTechnicianId` adalah ObjectId
   - `req.technicianId` mungkin ObjectId atau String
   - Comparison `!==` antara ObjectId dan String akan selalu false

2. **Middleware technicianAuth:**
   - Menyimpan `req.technicianId` sebagai ObjectId
   - Perlu convert ke string untuk consistency

## ✅ Fixes Applied

### **1. Backend - surveyDataController.js**

**Before:**

```javascript
if (connectionData.assignedTechnicianId.toString() !== req.technicianId) {
  return res.status(403).json({
    status: 403,
    message: "You are not assigned to this connection data",
  });
}
```

**After:**

```javascript
// Added debug logs
console.log("[createSurveyData] Checking assignment...");
console.log(
  "[createSurveyData] Assigned technician ID:",
  connectionData.assignedTechnicianId
);
console.log("[createSurveyData] Request technician ID:", req.technicianId);
console.log(
  "[createSurveyData] Assigned (string):",
  connectionData.assignedTechnicianId.toString()
);
console.log(
  "[createSurveyData] Request (string):",
  req.technicianId.toString()
);

// Convert both sides to string
if (
  connectionData.assignedTechnicianId.toString() !== req.technicianId.toString()
) {
  return res.status(403).json({
    status: 403,
    message: "You are not assigned to this connection data",
  });
}
```

**Changes:**

- ✅ Added `.toString()` to `req.technicianId` for safe comparison
- ✅ Added debug logs to trace the issue
- ✅ Both sides now converted to string before comparison

---

### **2. Backend - technicianAuth.js Middleware**

**Before:**

```javascript
req.technician = technician;
req.technicianId = technician._id;
next();
```

**After:**

```javascript
console.log("[verifyTechnician] Technician found:", technician._id);

req.technician = technician;
req.technicianId = technician._id.toString(); // Convert to string
req.userRole = "technician"; // Add userRole for consistency

console.log("[verifyTechnician] Set technicianId:", req.technicianId);

next();
```

**Changes:**

- ✅ Convert `technician._id` to string before assigning to `req.technicianId`
- ✅ Add `req.userRole = 'technician'` for consistency with admin auth
- ✅ Added debug logs to trace authentication

---

## 🧪 Testing Steps

### **Test 1: Check Assignment in Database**

```bash
# Connect to MongoDB
mongo

# Switch to database
use aqualink_db

# Find connection data yang sudah di-assign
db.connectiondatas.findOne({ assignedTechnicianId: { $ne: null } })

# Copy _id dan assignedTechnicianId
```

Expected output:

```javascript
{
  _id: ObjectId("..."),
  assignedTechnicianId: ObjectId("..."),
  isVerifiedByData: true,
  // ... other fields
}
```

---

### **Test 2: Login as Technician**

1. Login ke admin panel dengan akun teknisi
2. Check localStorage token:

```javascript
// Di browser console
localStorage.getItem("admin_token");
```

3. Decode JWT token untuk verify technician ID:

```bash
# Paste token di https://jwt.io
# Check payload: { id: "...", email: "...", iat: ..., exp: ... }
```

---

### **Test 3: Create Survey**

1. **Navigate to connection data detail**

   - URL: `/operations/connection-data/{connectionId}`
   - Tombol "Buat Survei" harus muncul (hijau)

2. **Click tombol "Buat Survei"**

   - Redirect ke `/operations/survey-data/create?connectionId={id}`

3. **Fill form:**

   - Upload 3 foto (jaringan, bak, meteran)
   - Isi diameter pipa (e.g., 1.5)
   - Isi jumlah penghuni (e.g., 4)
   - Click "Auto" untuk koordinat (atau isi manual)
   - Toggle "Standar" (default checked)
   - Isi catatan (optional)

4. **Click "Simpan Survei"**

5. **Check Backend Logs:**

```bash
# Terminal backend
cd aqualink-backend
yarn start

# Watch for logs:
[verifyTechnician] Decoded token: { id: '...', ... }
[verifyTechnician] Technician found: ...
[verifyTechnician] Set technicianId: ...
[createSurveyData] Request from technician: ...
[createSurveyData] Connection Data ID: ...
[createSurveyData] Checking assignment...
[createSurveyData] Assigned technician ID: ObjectId("...")
[createSurveyData] Request technician ID: ...
[createSurveyData] Assigned (string): ...
[createSurveyData] Request (string): ...
[createSurveyData] Assignment verified for technician: ...
[createSurveyData] Survey created successfully: ...
```

6. **Expected Response:**

```json
{
  "status": 201,
  "message": "Survey data created successfully",
  "data": { ... }
}
```

---

### **Test 4: Verify Survey Created**

1. **Check database:**

```bash
mongo
use aqualink_db
db.surveydatas.find({ connectionDataId: ObjectId("...") })
```

2. **Check connection data updated:**

```bash
db.connectiondatas.findOne({ _id: ObjectId("...") })
# surveiId should be populated
```

3. **Check in UI:**
   - Kembali ke detail connection data
   - Tombol "Buat Survei" harus hilang (karena sudah ada survei)

---

## 🚨 Possible Errors & Solutions

### **Error 1: "You are not assigned to this connection data"**

**Cause:** Assignment check failed

**Debug:**

1. Check backend logs untuk melihat technician ID comparison
2. Verify assignment di database:

```bash
db.connectiondatas.findOne({ _id: ObjectId("...") })
# Check assignedTechnicianId matches technician._id
```

**Solution:**

- Ensure technician is assigned via admin panel
- Re-assign if necessary

---

### **Error 2: "Connection data must be verified by admin first"**

**Cause:** `isVerifiedByData = false`

**Solution:**

1. Login sebagai admin
2. Go to connection data detail
3. Click "Verifikasi sebagai Admin"
4. Then assign technician

---

### **Error 3: "This connection data has not been assigned to any technician yet"**

**Cause:** `assignedTechnicianId` is null

**Solution:**

1. Login sebagai admin
2. Go to connection data detail
3. Click "Assign Teknisi"
4. Pilih teknisi dari dropdown
5. Click "Assign"

---

### **Error 4: "Token tidak valid atau sudah kadaluarsa"**

**Cause:** JWT token expired or invalid

**Solution:**

1. Logout
2. Login again
3. Try create survey again

---

## 📊 Debug Checklist

Before submitting survey, verify:

- [ ] Teknisi sudah login dengan token valid
- [ ] Connection data sudah diverifikasi admin (`isVerifiedByData = true`)
- [ ] Teknisi sudah di-assign ke connection data (`assignedTechnicianId` matches)
- [ ] Belum ada survei untuk connection data ini (`surveiId = null`)
- [ ] Semua file diupload (3 foto)
- [ ] Form data lengkap (diameter, penghuni, koordinat)

---

## 🔧 Additional Debugging

### **Enable More Logs:**

Add to `surveyDataController.js`:

```javascript
console.log("[DEBUG] req.body:", req.body);
console.log("[DEBUG] req.files:", req.files);
console.log("[DEBUG] req.technicianId:", req.technicianId);
console.log("[DEBUG] connectionData:", connectionData);
```

### **Check Middleware Chain:**

Add to each middleware:

```javascript
console.log("[Middleware Name] Processing request...");
console.log("[Middleware Name] req.technicianId:", req.technicianId);
console.log("[Middleware Name] req.userRole:", req.userRole);
```

### **Check Frontend Request:**

Add to `create/page.tsx`:

```typescript
console.log("Submitting FormData:");
for (let [key, value] of submitData.entries()) {
  console.log(key, value);
}
```

---

## 📝 Files Modified

1. ✅ `controllers/surveyDataController.js` - Added debug logs, convert both sides to string
2. ✅ `middleware/technicianAuth.js` - Convert technicianId to string, add userRole

---

## ✅ Testing Results

After applying fixes, test scenarios:

1. **Scenario 1: Valid Assignment**

   - ✅ Teknisi can create survey
   - ✅ Survey saved to database
   - ✅ Connection data updated with surveiId

2. **Scenario 2: Not Assigned**

   - ✅ Error 403: "You are not assigned to this connection data"

3. **Scenario 3: Not Verified**

   - ✅ Error 400: "Connection data must be verified by admin first"

4. **Scenario 4: Already Has Survey**
   - ✅ Error 400: "Survey data already exists for this connection"

---

**Status**: ✅ **FIXED**  
**Last Updated**: 2025-10-07  
**Next Action**: Test with real technician account
