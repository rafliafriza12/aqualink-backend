# PDF Viewer Modal - Implementation

## 📋 Overview

Implementasi PDF viewer modal untuk menampilkan dokumen (NIK, KK, IMB) langsung di halaman tanpa membuka tab baru. Memberikan user experience yang lebih baik dengan viewer yang terintegrasi.

## 🎯 Perubahan dari Tab Baru ke Modal Viewer

### Before ❌

```typescript
const handleOpenDocument = (url: string) => {
  window.open(url, "_blank");
};
```

- Membuka dokumen di tab baru
- User kehilangan context
- Tidak ada kontrol viewer

### After ✅

```typescript
const handleOpenDocument = (url: string, title: string) => {
  setCurrentPdfUrl(url);
  setCurrentPdfTitle(title);
  setOpenPdfModal(true);
};
```

- Membuka dokumen dalam modal
- User tetap di halaman yang sama
- Ada kontrol close, fullscreen, dll

## ✨ Fitur Modal PDF Viewer

### 1. **Full Screen Modal**

- Modal mengambil 90% viewport height
- Responsive untuk semua ukuran layar
- Backdrop blur untuk fokus pada dokumen

### 2. **Header dengan Title**

- Menampilkan nama dokumen yang dibuka
- Close button di kanan atas
- Dark theme konsisten dengan app

### 3. **PDF Viewer (iframe)**

- Menggunakan native browser PDF viewer
- Support zoom, scroll, download (dari browser)
- Loading state handled by browser

### 4. **Footer Actions**

- **"Buka di Tab Baru"**: Option untuk buka di tab baru jika diperlukan
- **"Tutup"**: Close modal dan kembali ke halaman

### 5. **UX Improvements**

- Klik backdrop untuk close
- ESC key untuk close (Material-UI default)
- Smooth fade transition
- Modal z-index tinggi (above all content)

## 🎨 UI Design

### Modal Structure

```
┌─────────────────────────────────────────┐
│  📄 Dokumen NIK                    [✕]  │ ← Header
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         [PDF CONTENT HERE]              │ ← Viewer
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [Buka di Tab Baru →]        [Tutup]   │ ← Footer
└─────────────────────────────────────────┘
```

### Color Scheme

- **Header/Footer Background**: #202226 (dark)
- **Viewer Background**: #f3f4f6 (light gray)
- **Backdrop**: rgba(0,0,0,0.8) (80% opacity)
- **Text**: White on dark, gray on light
- **Accent**: #5F68FE (blue)

### Dimensions

- **Modal Width**: max-w-4xl (responsive)
- **Modal Height**: 90vh
- **Padding**: px-6 py-4
- **Border Radius**: rounded-2xl

## 💻 Implementation Details

### State Management

```typescript
const [openPdfModal, setOpenPdfModal] = useState(false);
const [currentPdfUrl, setCurrentPdfUrl] = useState("");
const [currentPdfTitle, setCurrentPdfTitle] = useState("");
```

### Modal Handlers

```typescript
const handleOpenDocument = (url: string, title: string) => {
  setCurrentPdfUrl(url);
  setCurrentPdfTitle(title);
  setOpenPdfModal(true);
};

const handleClosePdfModal = () => {
  setOpenPdfModal(false);
  setCurrentPdfUrl("");
  setCurrentPdfTitle("");
};
```

### Button Calls

```typescript
// NIK Document
<button onClick={() =>
  handleOpenDocument(connectionData.nikUrl, "Dokumen NIK")
}>
  Lihat Dokumen →
</button>

// KK Document
<button onClick={() =>
  handleOpenDocument(connectionData.kkUrl, "Dokumen Kartu Keluarga")
}>
  Lihat Dokumen →
</button>

// IMB Document
<button onClick={() =>
  handleOpenDocument(connectionData.imbUrl, "Dokumen IMB")
}>
  Lihat Dokumen →
</button>
```

## 🔧 Technical Stack

### Libraries Used

- **@mui/material**: Modal & Fade components
- **@mui/icons-material**: Close icon
- **HTML iframe**: Native PDF rendering

### Why iframe?

1. ✅ **Native Browser Support**: Menggunakan PDF viewer bawaan browser
2. ✅ **No Dependencies**: Tidak perlu library tambahan seperti react-pdf
3. ✅ **Full Features**: User dapat zoom, scroll, download dari browser
4. ✅ **Performance**: Ringan dan cepat
5. ✅ **Compatibility**: Support semua browser modern

### Alternative: react-pdf

Jika diperlukan custom PDF controls, bisa upgrade ke react-pdf:

```typescript
import { Document, Page } from "react-pdf";

<Document file={currentPdfUrl}>
  <Page pageNumber={1} />
</Document>;
```

## 📱 Responsive Design

### Desktop (>768px)

- Modal width: 1024px (max-w-4xl)
- Full controls visible
- Spacious padding

### Tablet (768px - 1024px)

- Modal width: 90vw
- Adjusted padding
- Optimized for touch

### Mobile (<768px)

- Modal width: 95vw
- Compact header/footer
- Touch-optimized buttons

## 🎯 User Interactions

### Opening Document

```
User clicks "Lihat Dokumen →"
    ↓
Modal opens with fade transition
    ↓
PDF loads in iframe
    ↓
User can view, zoom, scroll PDF
```

### Closing Modal

**Option 1:** Click backdrop
**Option 2:** Click close button (✕)
**Option 3:** Click "Tutup" button
**Option 4:** Press ESC key

```
User closes modal (any method)
    ↓
Modal fades out
    ↓
Back to view-connection-data page
    ↓
Modal state reset
```

### Opening in New Tab

```
User clicks "Buka di Tab Baru →"
    ↓
New tab opens with PDF
    ↓
Modal remains open
    ↓
User can close modal or continue viewing
```

## 🧪 Test Scenarios

### Test 1: Open NIK Document

**Action:** Click "Lihat Dokumen" on NIK card

**Expected:**

- ✅ Modal opens
- ✅ Title shows "Dokumen NIK"
- ✅ PDF loads from nikUrl
- ✅ Backdrop visible

### Test 2: Open KK Document

**Action:** Click "Lihat Dokumen" on KK card

**Expected:**

- ✅ Modal opens
- ✅ Title shows "Dokumen Kartu Keluarga"
- ✅ PDF loads from kkUrl

### Test 3: Open IMB Document

**Action:** Click "Lihat Dokumen" on IMB card

**Expected:**

- ✅ Modal opens
- ✅ Title shows "Dokumen IMB"
- ✅ PDF loads from imbUrl

### Test 4: Close Modal - Backdrop

**Action:** Click outside modal (on backdrop)

**Expected:**

- ✅ Modal closes with fade out
- ✅ Returns to main page
- ✅ State reset

### Test 5: Close Modal - Button

**Action:** Click "Tutup" button

**Expected:**

- ✅ Modal closes
- ✅ Smooth transition

### Test 6: Open in New Tab

**Action:** Click "Buka di Tab Baru →"

**Expected:**

- ✅ New tab opens
- ✅ PDF loads in new tab
- ✅ Modal stays open in original tab

### Test 7: ESC Key

**Action:** Press ESC key while modal open

**Expected:**

- ✅ Modal closes
- ✅ State reset

### Test 8: Multiple Documents

**Action:** Open NIK → Close → Open KK → Close → Open IMB

**Expected:**

- ✅ Each document opens correctly
- ✅ Title updates for each document
- ✅ PDF URL updates for each document
- ✅ No state conflicts

## 📊 Comparison: Before vs After

| Aspect        | Before (Tab Baru)         | After (Modal)             |
| ------------- | ------------------------- | ------------------------- |
| User Context  | ❌ Lost                   | ✅ Maintained             |
| Navigation    | ❌ Back/Forward confusion | ✅ Simple close           |
| Loading       | ❌ Full page reload       | ✅ Modal transition       |
| Mobile UX     | ❌ New tab overhead       | ✅ Smooth modal           |
| Controls      | ❌ Browser only           | ✅ App + Browser          |
| Accessibility | ⚠️ Moderate               | ✅ Better (ESC, backdrop) |

## 🎨 CSS Classes Used

### Modal Container

```css
fixed inset-0 flex items-center justify-center p-4 z-50
```

- Full viewport overlay
- Centered content
- High z-index

### Backdrop

```css
absolute inset-0 bg-black/80
```

- Full coverage
- 80% opacity black
- Clickable to close

### Modal Content

```css
relative bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl
```

- White background
- Large rounded corners
- Responsive width
- 90% viewport height
- Flex column layout
- Shadow for depth

### Header/Footer

```css
bg-[#202226] border-b/t border-gray-700
```

- Dark background
- Border separation
- Consistent theme

### iframe

```css
w-full h-full border-0
```

- Full size
- No border
- Clean integration

## 🔒 Security Considerations

### iframe Sandboxing

Current implementation loads Cloudinary URLs directly:

```typescript
<iframe src={currentPdfUrl} />
```

**Considerations:**

- ✅ Cloudinary URLs are trusted
- ✅ HTTPS enforced
- ⚠️ Consider adding sandbox attribute for extra security:
  ```typescript
  <iframe src={currentPdfUrl} sandbox="allow-same-origin allow-scripts" />
  ```

### CORS

- ✅ Cloudinary handles CORS correctly
- ✅ No cross-origin issues expected

## 📝 Code Structure

```typescript
ViewConnectionDataPage
├── State
│   ├── connectionData (existing)
│   ├── isLoading (existing)
│   ├── openPdfModal (NEW)
│   ├── currentPdfUrl (NEW)
│   └── currentPdfTitle (NEW)
├── Handlers
│   ├── handleOpenDocument (UPDATED)
│   └── handleClosePdfModal (NEW)
└── JSX
    ├── Main Content (existing)
    │   └── Document Buttons (UPDATED)
    └── PDF Modal (NEW)
        ├── Header
        ├── Viewer (iframe)
        └── Footer
```

## 🚀 Performance

### Lazy Loading

- Modal only renders when `openPdfModal = true`
- iframe only loads when modal opens
- No performance impact when closed

### Memory

- State cleanup on modal close
- No memory leaks
- Garbage collection handles iframe

### Load Time

- PDF loads in browser's native viewer
- No additional JS bundling needed
- Fast rendering

## ✅ Benefits

### User Experience

1. **Context Preservation**: User tetap di halaman yang sama
2. **Quick Access**: Cepat buka dan tutup dokumen
3. **No Tab Clutter**: Tidak banyak tab terbuka
4. **Mobile Friendly**: Lebih baik di mobile browser

### Developer Experience

1. **Simple Implementation**: Hanya state + modal
2. **No Dependencies**: Menggunakan native browser
3. **Easy Maintenance**: Sedikit code, mudah debug
4. **Flexible**: Mudah upgrade ke library lain jika perlu

### Business

1. **Better Engagement**: User lebih lama di app
2. **Reduced Confusion**: Clear UX flow
3. **Professional Look**: Modal lebih polished

## 📁 Files Modified

1. ✅ `/app/(pages)/(private)/profile/view-connection-data/page.tsx`
   - Import Close icon & Modal components
   - Add state for modal
   - Update handleOpenDocument function
   - Add handleClosePdfModal function
   - Update all document buttons
   - Add PDF Modal component

## 🔄 Migration Notes

### Breaking Changes

- None (internal component update only)

### Backward Compatibility

- ✅ All existing features work
- ✅ No API changes
- ✅ No prop changes

---

**Status:** ✅ Implemented
**Date:** 2025-10-03
**Version:** 2.0.0
**Type:** UX Enhancement
