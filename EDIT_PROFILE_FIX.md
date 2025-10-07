# Edit Profile Logic Fix

## 🐛 Bug yang Ditemukan

### Masalah

Ketika user mengedit profile dengan **data yang sama** (email atau fullName yang sama dengan milik sendiri), sistem mengembalikan error:

```json
{
  "status": 400,
  "message": "Email sudah digunakan"
}
```

### Root Cause

Logika validasi tidak memeriksa apakah email/fullName yang "sudah digunakan" adalah milik user yang sedang edit itu sendiri.

**Kode Lama (BUGGY):**

```javascript
const emailAlreadyRegistered = await usersModel.findOne({
  email: newEmail,
});

if (emailAlreadyRegistered) {
  return res.status(400).json({
    status: 400,
    message: "Email sudah digunakan",
  });
}
```

**Masalah:**

- Query mencari email di **semua user** termasuk user yang sedang edit
- Ketika user edit dengan email yang sama → akan menemukan dirinya sendiri → error "Email sudah digunakan"
- Seharusnya: hanya error jika email digunakan oleh **user lain**

## ✅ Solusi

### Perubahan Logika

**Prinsip:**

1. Fetch user data terlebih dahulu
2. Cek apakah data berubah (email/fullName berbeda dari data lama)
3. Jika berubah, baru validasi apakah digunakan user lain (exclude current user dengan `_id: { $ne: id }`)
4. Jika tidak berubah, skip validasi (tidak perlu cek)

**Kode Baru (FIXED):**

```javascript
export const editProfile = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newFullName, newEmail, newPhone } = req.body;

      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "ID Pengguna diperlukan, tetapi tidak disediakan",
        });
      }

      if (!newFullName || !newEmail) {
        return res.status(400).json({
          status: 400,
          message: "Semua kolom diperlukan, tetapi tidak disediakan",
        });
      }

      // ✅ FIX 1: Get current user data first
      const user = await usersModel.findById(id);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Pengguna tidak ditemukan",
        });
      }

      // ✅ FIX 2: Check if email is being changed
      if (newEmail !== user.email) {
        const emailAlreadyRegistered = await usersModel.findOne({
          email: newEmail,
          _id: { $ne: id }, // ← Exclude current user
        });

        if (emailAlreadyRegistered) {
          return res.status(400).json({
            status: 400,
            message: "Email sudah digunakan oleh pengguna lain",
          });
        }
      }

      // ✅ FIX 3: Check if fullName is being changed
      if (newFullName !== user.fullName) {
        const nameAlreadyRegistered = await usersModel.findOne({
          fullName: newFullName,
          _id: { $ne: id }, // ← Exclude current user
        });

        if (nameAlreadyRegistered) {
          return res.status(400).json({
            status: 400,
            message: "Nama sudah digunakan oleh pengguna lain",
          });
        }
      }

      // Update user data
      user.set("fullName", newFullName);
      user.set("email", newEmail);

      // Update phone if provided
      if (newPhone !== undefined) {
        user.set("phone", newPhone || null);
      }

      await user.save();

      // Create notification for profile update
      const profileNotification = new Notification({
        userId: id,
        title: "Profil Diperbarui",
        message: "Profil akun Anda telah berhasil diperbarui.",
        category: "INFORMASI",
        link: `/profile/${id}`,
      });

      await profileNotification.save();

      return res.status(200).json({
        status: 200,
        data: user,
        message: "Profil berhasil diubah",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal",
      });
    }
  },
];
```

## 🔍 Perubahan Detail

### 1. Urutan Eksekusi Diubah

**Before:**

```javascript
1. Validate required fields
2. Check email exists (all users) ❌
3. Check name exists (all users) ❌
4. Get user by id
5. Update user
```

**After:**

```javascript
1. Validate required fields
2. Get user by id ✅
3. Check if email changed → validate (exclude self) ✅
4. Check if name changed → validate (exclude self) ✅
5. Update user
```

### 2. Conditional Validation

**Email Validation:**

```javascript
// Only validate if email is being changed
if (newEmail !== user.email) {
  // Check if new email is used by another user
  const emailAlreadyRegistered = await usersModel.findOne({
    email: newEmail,
    _id: { $ne: id }, // Exclude current user
  });

  if (emailAlreadyRegistered) {
    return res.status(400).json({
      status: 400,
      message: "Email sudah digunakan oleh pengguna lain",
    });
  }
}
// If email not changed, skip validation (allow same email)
```

**FullName Validation:**

```javascript
// Only validate if fullName is being changed
if (newFullName !== user.fullName) {
  // Check if new name is used by another user
  const nameAlreadyRegistered = await usersModel.findOne({
    fullName: newFullName,
    _id: { $ne: id }, // Exclude current user
  });

  if (nameAlreadyRegistered) {
    return res.status(400).json({
      status: 400,
      message: "Nama sudah digunakan oleh pengguna lain",
    });
  }
}
// If name not changed, skip validation (allow same name)
```

### 3. MongoDB Query Improvement

**Before:**

```javascript
findOne({ email: newEmail });
// Finds ANY user with this email (including self)
```

**After:**

```javascript
findOne({ email: newEmail, _id: { $ne: id } });
// Finds ONLY OTHER users with this email (excluding self)
```

## 🧪 Test Cases

### Test 1: Edit dengan Data yang Sama (Main Bug Fix)

**Input:**

```javascript
PUT /users/editProfile/user123
{
  newEmail: "user@example.com",  // ← Same as current
  newFullName: "John Doe",       // ← Same as current
  newPhone: "08123456789"
}
```

**Before (BUGGY):**

```json
{
  "status": 400,
  "message": "Email sudah digunakan"
}
```

**After (FIXED):**

```json
{
  "status": 200,
  "message": "Profil berhasil diubah",
  "data": { ... }
}
```

### Test 2: Edit Email ke Email User Lain

**Setup:**

- User A: email = "userA@example.com"
- User B: email = "userB@example.com"

**Input (User A mencoba ganti email ke email User B):**

```javascript
PUT /users/editProfile/userA_id
{
  newEmail: "userB@example.com",  // ← Email User B
  newFullName: "User A"
}
```

**Result:**

```json
{
  "status": 400,
  "message": "Email sudah digunakan oleh pengguna lain"
}
```

✅ **Correct:** Should reject

### Test 3: Edit Email ke Email Baru (Belum Digunakan)

**Input:**

```javascript
PUT /users/editProfile/user123
{
  newEmail: "newemail@example.com",  // ← Email baru
  newFullName: "John Doe"
}
```

**Result:**

```json
{
  "status": 200,
  "message": "Profil berhasil diubah",
  "data": {
    email: "newemail@example.com",
    ...
  }
}
```

✅ **Correct:** Should update

### Test 4: Edit Hanya Phone (Email & Name Sama)

**Input:**

```javascript
PUT /users/editProfile/user123
{
  newEmail: "user@example.com",  // ← Same
  newFullName: "John Doe",       // ← Same
  newPhone: "08199999999"        // ← Changed
}
```

**Result:**

```json
{
  "status": 200,
  "message": "Profil berhasil diubah",
  "data": {
    phone: "08199999999",
    ...
  }
}
```

✅ **Correct:** Should update phone only

### Test 5: Edit FullName ke Nama User Lain

**Setup:**

- User A: fullName = "Alice"
- User B: fullName = "Bob"

**Input (User A mencoba ganti nama ke nama User B):**

```javascript
PUT /users/editProfile/userA_id
{
  newEmail: "alice@example.com",
  newFullName: "Bob"  // ← Nama User B
}
```

**Result:**

```json
{
  "status": 400,
  "message": "Nama sudah digunakan oleh pengguna lain"
}
```

✅ **Correct:** Should reject

## 📊 Comparison Table

| Scenario                          | Old Logic      | New Logic      |
| --------------------------------- | -------------- | -------------- |
| Edit dengan email sama            | ❌ Error 400   | ✅ Success 200 |
| Edit dengan nama sama             | ❌ Error 400   | ✅ Success 200 |
| Edit email ke email user lain     | ✅ Error 400   | ✅ Error 400   |
| Edit nama ke nama user lain       | ✅ Error 400   | ✅ Error 400   |
| Edit email baru (belum digunakan) | ✅ Success 200 | ✅ Success 200 |
| Edit hanya phone (data lain sama) | ❌ Error 400   | ✅ Success 200 |

## 🎯 Benefits

1. **User Experience** ✅

   - User bisa edit profile tanpa harus mengubah semua field
   - Tidak ada error aneh saat edit dengan data yang sama
   - Lebih intuitive

2. **Data Integrity** ✅

   - Tetap mencegah duplicate email/name dari user berbeda
   - Allow user update data sendiri
   - Proper validation logic

3. **Performance** ✅

   - Skip validation jika data tidak berubah
   - Mengurangi query database yang tidak perlu

4. **Code Quality** ✅
   - Logic lebih jelas dan maintainable
   - Proper separation of concerns
   - Better error messages

## 🔧 Technical Details

### MongoDB Query Operator: `$ne`

```javascript
{
  _id: {
    $ne: id;
  }
}
```

- `$ne` = "not equal"
- Excludes document dengan `_id` sama dengan `id`
- Memastikan hanya cek user lain, bukan diri sendiri

### Conditional Check

```javascript
if (newEmail !== user.email) {
  // Only run validation if email changed
}
```

- String comparison untuk detect perubahan
- Skip validation jika sama → improve performance
- Clear intent in code

## 📝 Error Messages

### Before

```
"Email sudah digunakan"
"Nama sudah digunakan"
```

❌ Ambiguous: tidak jelas apakah itu milik sendiri atau orang lain

### After

```
"Email sudah digunakan oleh pengguna lain"
"Nama sudah digunakan oleh pengguna lain"
```

✅ Clear: jelas bahwa itu digunakan user lain (bukan diri sendiri)

## 📁 Files Modified

1. ✅ `aqualink-backend/controllers/userController.js`
   - Function: `editProfile`
   - Lines: ~120-200
   - Changes:
     - Move user fetch before validation
     - Add conditional validation
     - Add `_id: { $ne: id }` to queries
     - Update error messages

## 🚀 Deployment Notes

- No database migration needed
- No breaking changes
- Backward compatible
- Can be deployed immediately

## ✅ Checklist

- [x] Fix: Allow edit with same email
- [x] Fix: Allow edit with same fullName
- [x] Fix: Allow edit with same phone
- [x] Maintain: Reject duplicate email from other users
- [x] Maintain: Reject duplicate fullName from other users
- [x] Improve: Better error messages
- [x] Improve: Skip validation if no change
- [x] Test: All scenarios covered
- [x] Documentation: Complete

---

**Status:** ✅ Fixed & Tested
**Date:** 2025-10-03
**Version:** 1.0.0
**Bug Priority:** High (User-facing, common use case)
