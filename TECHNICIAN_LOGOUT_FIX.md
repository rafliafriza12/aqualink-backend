# 🔧 FIX: Teknisi Logout Otomatis (Auto Logout Issue)

## Tanggal: 8 Oktober 2025

---

## 🐛 Problem

User melaporkan bahwa **ketika login sebagai teknisi, tiba-tiba ter-logout secara otomatis**.

### Symptoms:

- ✅ Login teknisi berhasil
- ✅ Token diterima dan disimpan
- ❌ Setelah beberapa request, teknisi ter-logout
- ❌ Harus login ulang berkali-kali

---

## 🔍 Root Causes

### **1. Bug di `getTechnicianProfile()` - Wrong Property Access**

**Location**: `/controllers/technicianController.js` line 147

**Before:**

```javascript
export const getTechnicianProfile = async (req, res) => {
  try {
    const technicianId = req.technician.id; // ❌ WRONG!

    const technician = await Technician.findById(technicianId).select(
      "-password -token"
    );
    // ...
  }
};
```

**Problem:**

- Middleware `verifyTechnician` mengset `req.technician` sebagai **Technician object lengkap**
- Code mencoba akses `req.technician.id` yang **undefined**
- `findById(undefined)` returns null
- Response 404 "Technician not found"
- Frontend menganggap logout dan redirect ke login

**Middleware sets:**

```javascript
// middleware/technicianAuth.js
req.technician = technician; // Full object
req.technicianId = technician._id.toString(); // String ID
```

**Should use:**

- `req.technicianId` (already set by middleware) ✅
- OR `req.technician._id` ✅
- NOT `req.technician.id` ❌

---

### **2. Bug di `logoutTechnician()` - Same Issue**

**Location**: `/controllers/technicianController.js` line 235

**Before:**

```javascript
export const logoutTechnician = async (req, res) => {
  try {
    const technicianId = req.technician.id; // ❌ WRONG!

    await Technician.findByIdAndUpdate(technicianId, { token: null });
    // ...
  }
};
```

**Problem:**

- Same issue as `getTechnicianProfile()`
- `technicianId` is undefined
- `findByIdAndUpdate(undefined, ...)` fails silently
- Token NOT cleared in database
- Old token still valid even after "logout"

---

### **3. Missing Token Validation in Middleware**

**Location**: `/middleware/technicianAuth.js`

**Before:**

```javascript
export const verifyTechnician = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if technician exists
    const technician = await Technician.findById(decoded.id);
    if (!technician) {
      return res.status(403).json({
        status: 403,
        message: "Access denied. Technician only.",
      });
    }

    // ❌ MISSING: No check if token in DB matches

    req.technician = technician;
    req.technicianId = technician._id.toString();
    next();
  } catch (error) {
    // ...
  }
};
```

**Problem:**

- Middleware hanya cek JWT signature valid
- Middleware hanya cek technician exists
- **TIDAK** cek apakah token di database sama dengan token yang dikirim
- Jadi ketika logout (token DB = null), old token masih bisa dipakai!

**Security Issue:**

```
1. Technician login → token saved to DB
2. Technician logout → token set to NULL in DB
3. Old token still valid in JWT (not expired)
4. Middleware only checks JWT validity, not DB token
5. ❌ Old token still works! (Security vulnerability)
```

---

## ✅ Solutions Implemented

### **Fix 1: Correct `getTechnicianProfile()`**

**File**: `/controllers/technicianController.js`

```javascript
// Get Technician Profile
export const getTechnicianProfile = async (req, res) => {
  try {
    const technicianId = req.technicianId; // ✅ FIXED: was req.technician.id

    const technician = await Technician.findById(technicianId).select(
      "-password -token"
    );

    if (!technician) {
      return res.status(404).json({
        status: 404,
        message: "Technician not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: technician,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
```

**Changes:**

- ✅ Changed from `req.technician.id` to `req.technicianId`
- ✅ Now correctly retrieves technician ID from middleware

---

### **Fix 2: Correct `logoutTechnician()`**

**File**: `/controllers/technicianController.js`

```javascript
// Logout Technician
export const logoutTechnician = async (req, res) => {
  try {
    const technicianId = req.technicianId; // ✅ FIXED: was req.technician.id

    await Technician.findByIdAndUpdate(technicianId, { token: null });

    res.status(200).json({
      status: 200,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
```

**Changes:**

- ✅ Changed from `req.technician.id` to `req.technicianId`
- ✅ Now correctly updates token in database
- ✅ Logout actually works!

---

### **Fix 3: Add Token Validation to Middleware**

**File**: `/middleware/technicianAuth.js`

```javascript
export const verifyTechnician = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("[verifyTechnician] Decoded token:", decoded);

    // Check if technician exists
    const technician = await Technician.findById(decoded.id);
    if (!technician) {
      return res.status(403).json({
        status: 403,
        message: "Access denied. Technician only.",
      });
    }

    // ✅ CRITICAL FIX: Check if token in DB matches the one provided
    if (technician.token !== token) {
      return res.status(403).json({
        status: 403,
        message: "Invalid token. Please login again.",
      });
    }

    console.log("[verifyTechnician] Technician found:", technician._id);

    req.technician = technician;
    req.technicianId = technician._id.toString();
    req.userRole = "technician";

    console.log("[verifyTechnician] Set technicianId:", req.technicianId);

    next();
  } catch (error) {
    res.status(403).json({
      status: 403,
      message: "Invalid or expired token.",
    });
  }
};
```

**Changes:**

- ✅ Added token comparison: `technician.token !== token`
- ✅ Now validates token against database
- ✅ Logout properly invalidates old tokens
- ✅ Prevents using old tokens after logout

**Security Benefits:**

- 🔒 Token must match DB to be valid
- 🔒 Logout immediately invalidates token
- 🔒 Old tokens cannot be reused
- 🔒 Prevents session hijacking

---

## 📊 Flow Comparison

### **Before (Broken):**

```
1. Technician Login
   POST /technician/login
   ↓
   Token generated and saved to DB
   ✅ Response: { token: "abc123..." }

2. Technician calls Profile
   GET /technician/profile
   Authorization: Bearer abc123...
   ↓
   Middleware: verifyTechnician()
   ↓
   req.technician = { _id, fullName, email, ... }
   req.technicianId = "507f1f77..."
   ↓
   Controller: getTechnicianProfile()
   const technicianId = req.technician.id; // ❌ undefined!
   ↓
   findById(undefined)
   ↓
   ❌ Response: 404 "Technician not found"
   ↓
   Frontend thinks: logged out! → redirect to login

3. Technician Logout
   POST /technician/logout
   ↓
   const technicianId = req.technician.id; // ❌ undefined!
   ↓
   findByIdAndUpdate(undefined, { token: null }) // fails silently
   ↓
   ❌ Token NOT cleared in DB
   ↓
   ✅ Response: 200 "Logout successful" (but actually failed)

4. Try to use old token
   GET /technician/profile
   Authorization: Bearer abc123... (old token)
   ↓
   Middleware: verifyTechnician()
   ↓
   JWT valid? ✅ Yes
   Technician exists? ✅ Yes
   Token matches DB? ❌ Not checked!
   ↓
   ✅ Request proceeds (security issue!)
```

### **After (Fixed):**

```
1. Technician Login
   POST /technician/login
   ↓
   Token generated and saved to DB
   ✅ Response: { token: "abc123..." }

2. Technician calls Profile
   GET /technician/profile
   Authorization: Bearer abc123...
   ↓
   Middleware: verifyTechnician()
   ↓
   req.technician = { _id, fullName, email, ... }
   req.technicianId = "507f1f77..." ✅
   ↓
   JWT valid? ✅ Yes
   Technician exists? ✅ Yes
   Token matches DB? ✅ Yes (new check!)
   ↓
   Controller: getTechnicianProfile()
   const technicianId = req.technicianId; ✅ Correct!
   ↓
   findById("507f1f77...")
   ↓
   ✅ Response: 200 { data: { _id, fullName, ... } }

3. Technician Logout
   POST /technician/logout
   ↓
   const technicianId = req.technicianId; ✅ Correct!
   ↓
   findByIdAndUpdate("507f1f77...", { token: null })
   ↓
   ✅ Token cleared in DB successfully
   ↓
   ✅ Response: 200 "Logout successful"

4. Try to use old token
   GET /technician/profile
   Authorization: Bearer abc123... (old token)
   ↓
   Middleware: verifyTechnician()
   ↓
   JWT valid? ✅ Yes
   Technician exists? ✅ Yes
   Token matches DB? ❌ No! (technician.token is now null)
   ↓
   ❌ Response: 403 "Invalid token. Please login again."
   ↓
   Frontend properly redirects to login
```

---

## 🧪 Testing Steps

### **Test 1: Login & Profile**

```bash
# 1. Login as Technician
POST http://localhost:5000/technician/login
Content-Type: application/json

{
  "email": "teknisi@pdam.com",
  "password": "teknisi123"
}

# Expected Response:
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Teknisi Lapangan",
    "email": "teknisi@pdam.com",
    "phone": "081234567890",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

# ✅ Copy the token

# 2. Get Profile
GET http://localhost:5000/technician/profile
Authorization: Bearer <token>

# Expected Response:
{
  "status": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Teknisi Lapangan",
    "email": "teknisi@pdam.com",
    "phone": "081234567890",
    "createdAt": "2025-10-08T00:00:00.000Z",
    "updatedAt": "2025-10-08T00:00:00.000Z"
  }
}

# ✅ Should work! No 404 error!
```

---

### **Test 2: Logout & Token Invalidation**

```bash
# 1. Logout
POST http://localhost:5000/technician/logout
Authorization: Bearer <token>

# Expected Response:
{
  "status": 200,
  "message": "Logout successful"
}

# 2. Check DB - Token should be null
# In MongoDB:
db.technicians.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

# Expected:
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  fullName: "Teknisi Lapangan",
  email: "teknisi@pdam.com",
  token: null, // ✅ Should be null!
  ...
}

# 3. Try to use old token
GET http://localhost:5000/technician/profile
Authorization: Bearer <old_token>

# Expected Response:
{
  "status": 403,
  "message": "Invalid token. Please login again."
}

# ✅ Old token should NOT work!
```

---

### **Test 3: Multiple Login Sessions**

```bash
# 1. Login from Device 1
POST /technician/login
{ "email": "teknisi@pdam.com", "password": "teknisi123" }
# Get token1: "eyJhbG..."

# 2. Login from Device 2 (same account)
POST /technician/login
{ "email": "teknisi@pdam.com", "password": "teknisi123" }
# Get token2: "eyJibG..."

# DB now has token2 (overwrites token1)

# 3. Try to use token1 (from Device 1)
GET /technician/profile
Authorization: Bearer <token1>

# Expected Response:
{
  "status": 403,
  "message": "Invalid token. Please login again."
}

# ✅ Only latest token works (token2)
# ✅ Old sessions automatically invalidated
```

---

### **Test 4: Frontend Integration**

```javascript
// 1. Login
const loginResponse = await fetch("http://localhost:5000/technician/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "teknisi@pdam.com",
    password: "teknisi123",
  }),
});

const { data } = await loginResponse.json();
localStorage.setItem("technician_token", data.token);

// 2. Get Profile (should work)
const profileResponse = await fetch(
  "http://localhost:5000/technician/profile",
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("technician_token")}`,
    },
  }
);

console.log(await profileResponse.json());
// ✅ Should return profile data

// 3. Logout
await fetch("http://localhost:5000/technician/logout", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("technician_token")}`,
  },
});

// 4. Try profile again (should fail)
const profileResponse2 = await fetch(
  "http://localhost:5000/technician/profile",
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("technician_token")}`,
    },
  }
);

console.log(await profileResponse2.json());
// ✅ Should return 403 "Invalid token"

localStorage.removeItem("technician_token");
// Redirect to login page
```

---

## 📝 Middleware Explanation

### **What Middleware Sets:**

```javascript
// middleware/technicianAuth.js
export const verifyTechnician = async (req, res, next) => {
  // ... validation ...

  const technician = await Technician.findById(decoded.id);

  req.technician = technician; // ✅ Full Technician object
  req.technicianId = technician._id.toString(); // ✅ String ID
  req.userRole = "technician"; // ✅ Role identifier

  next();
};
```

### **What Controllers Should Use:**

| Property                  | Type        | Use Case                                  |
| ------------------------- | ----------- | ----------------------------------------- |
| `req.technicianId`        | `string`    | ✅ **Recommended** - For queries, logging |
| `req.technician._id`      | `ObjectId`  | ✅ Alternative - For queries              |
| `req.technician.fullName` | `string`    | ✅ For displaying name                    |
| `req.technician.email`    | `string`    | ✅ For displaying email                   |
| `req.userRole`            | `string`    | ✅ For role-based logic                   |
| `req.technician.id`       | `undefined` | ❌ **WRONG** - Does not exist!            |

---

## 🔒 Security Improvements

### **Before (Insecure):**

- ❌ Logout doesn't invalidate token
- ❌ Old tokens work indefinitely (until JWT expires)
- ❌ Multiple sessions not managed
- ❌ Token theft risk (stolen token works forever)

### **After (Secure):**

- ✅ Logout immediately invalidates token
- ✅ Old tokens rejected by middleware
- ✅ Only one session per user (latest login)
- ✅ Token theft mitigated (can logout to invalidate)

### **Token Lifecycle:**

```
Login → Token Generated → Saved to DB
  ↓
Every Request → Middleware checks:
  1. JWT signature valid?
  2. Technician exists?
  3. Token matches DB? ← NEW CHECK!
  ↓
Logout → Token set to NULL in DB
  ↓
Old Requests → Token doesn't match DB → Rejected
```

---

## 📋 Similar Issues to Check

This same bug pattern might exist in other controllers. Check:

### **AdminAccount:**

```javascript
// middleware/adminAuth.js sets:
req.admin = admin;
req.userId = admin._id;

// Controllers should use:
req.userId ✅
// NOT:
req.admin.id ❌
```

### **User:**

```javascript
// middleware/auth.js sets:
req.user = decoded;

// Controllers should use:
req.user.userId ✅
// NOT:
req.user.id ❌ (depends on JWT payload)
```

---

## ✅ Status

**FIXED** ✅ - Teknisi sekarang tidak akan logout otomatis!

### What's Working Now:

- ✅ Login teknisi berhasil
- ✅ Get profile tidak return 404
- ✅ Logout properly clears token
- ✅ Old tokens tidak bisa dipakai lagi
- ✅ Security improved dengan token validation

### Benefits:

- 🎯 User experience lebih baik (no random logout)
- 🔒 Security lebih kuat (token validation)
- 🐛 Bug fixed di 2 endpoints
- 📊 Proper session management

---

**Last Updated**: 8 Oktober 2025
**Status**: ✅ RESOLVED
**Security Level**: 🔒 IMPROVED
