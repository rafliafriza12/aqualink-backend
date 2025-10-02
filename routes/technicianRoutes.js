import express from "express";
import {
  createTechnician,
  loginTechnician,
  getAllTechnicians,
  getTechnicianById,
  getTechnicianProfile,
  updateTechnician,
  deleteTechnician,
  logoutTechnician,
} from "../controllers/technicianController.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
import { verifyTechnician } from "../middleware/technicianAuth.js";

const router = express.Router();

// Public routes
router.post("/login", loginTechnician);

// Technician routes
router.get("/profile", verifyTechnician, getTechnicianProfile);
router.post("/logout", verifyTechnician, logoutTechnician);

// Admin routes
router.post("/", verifyAdmin, createTechnician);
router.get("/", verifyAdmin, getAllTechnicians);
router.get("/:id", verifyAdmin, getTechnicianById);
router.put("/:id", verifyAdmin, updateTechnician);
router.delete("/:id", verifyAdmin, deleteTechnician);

export default router;
