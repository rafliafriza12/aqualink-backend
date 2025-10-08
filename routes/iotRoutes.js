import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  generatePairingCode,
  pairDevice,
  getConnectionStatus,
  disconnectDevice,
  iotHeartbeat,
} from "../controllers/iotController.js";

const router = express.Router();

/**
 * User routes (authenticated)
 */

// Generate pairing code
router.post("/generate-pairing-code", verifyToken, generatePairingCode);

// Get connection status
router.get("/connection-status", verifyToken, getConnectionStatus);

// Disconnect device
router.post("/disconnect", verifyToken, disconnectDevice);

/**
 * IoT Device routes (public - called by IoT via bluetooth/wifi)
 */

// Pair device with pairing code
router.post("/pair-device", pairDevice);

// IoT heartbeat/sync
router.post("/heartbeat", iotHeartbeat);

export default router;
