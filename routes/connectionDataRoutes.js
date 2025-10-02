import express from "express";
import {
  createConnectionData,
  getConnectionDataByUser,
  getAllConnectionData,
  getConnectionDataById,
  verifyConnectionDataByAdmin,
  verifyConnectionDataByTechnician,
  completeAllProcedure,
  updateConnectionData,
  deleteConnectionData,
} from "../controllers/connectionDataController.js";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
import { verifyTechnician } from "../middleware/technicianAuth.js";
import { uploadConnectionDataFiles } from "../middleware/upload.js";

const router = express.Router();

// User routes
router.post("/", verifyToken, uploadConnectionDataFiles, createConnectionData);
router.get("/my-connection", verifyToken, getConnectionDataByUser);

// Admin routes
router.get("/", verifyAdmin, getAllConnectionData);
router.get("/:id", verifyAdmin, getConnectionDataById);
router.put("/:id/verify-admin", verifyAdmin, verifyConnectionDataByAdmin);
router.put("/:id/complete-procedure", verifyAdmin, completeAllProcedure);
router.put(
  "/:id",
  verifyAdmin,
  uploadConnectionDataFiles,
  updateConnectionData
);
router.delete("/:id", verifyAdmin, deleteConnectionData);

// Technician routes
router.put(
  "/:id/verify-technician",
  verifyTechnician,
  verifyConnectionDataByTechnician
);

export default router;
