import express from "express";
import {
  createSurveyData,
  getAllSurveyData,
  getSurveyDataById,
  getSurveyDataByConnectionId,
  updateSurveyData,
  deleteSurveyData,
} from "../controllers/surveyDataController.js";
import { verifyAdmin } from "../middleware/adminAuth.js";
import { verifyTechnician } from "../middleware/technicianAuth.js";
import { uploadSurveyDataFiles } from "../middleware/upload.js";

const router = express.Router();

// Technician routes
router.post("/", verifyTechnician, uploadSurveyDataFiles, createSurveyData);
router.put("/:id", verifyTechnician, uploadSurveyDataFiles, updateSurveyData);

// Admin & Technician routes
router.get("/", verifyAdmin, getAllSurveyData);
router.get("/:id", verifyAdmin, getSurveyDataById);
router.get(
  "/connection/:connectionDataId",
  verifyAdmin,
  getSurveyDataByConnectionId
);
router.delete("/:id", verifyAdmin, deleteSurveyData);

export default router;
