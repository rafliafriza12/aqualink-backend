import multer from "multer";

// Configure multer to use memory storage (store files in memory as Buffer)
const storage = multer.memoryStorage();

// File filter to only accept PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF files are allowed."), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Middleware untuk upload multiple files dengan field names yang spesifik
export const uploadConnectionDataFiles = upload.fields([
  { name: "nikFile", maxCount: 1 },
  { name: "kkFile", maxCount: 1 },
  { name: "imbFile", maxCount: 1 },
]);

export const uploadSurveyDataFiles = upload.fields([
  { name: "jaringanFile", maxCount: 1 },
  { name: "posisiBakFile", maxCount: 1 },
  { name: "posisiMeteranFile", maxCount: 1 },
]);

export const uploadRabFile = upload.single("rabFile");

export const uploadSingleFile = upload.single("file");

export default upload;
