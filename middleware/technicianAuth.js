import jwt from "jsonwebtoken";
import Technician from "../models/Technician.js";

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

    // Cek apakah user adalah teknisi
    const technician = await Technician.findById(decoded.id);
    if (!technician) {
      return res.status(403).json({
        status: 403,
        message: "Access denied. Technician only.",
      });
    }

    req.technician = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      status: 403,
      message: "Invalid or expired token.",
    });
  }
};
