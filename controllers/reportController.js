import Reports from "../models/Report.js";
import { verifyToken } from "../middleware/auth.js";
import mongoose from "mongoose";

// CREATE REPORT
export const createReport = [
  verifyToken,
  async (req, res) => {
    try {
      const { reporterID, reporterName, problem, address, coordinate } =
        req.body;

      // Validasi input
      if (!reporterID || !reporterName || !problem || !address || !coordinate) {
        return res.status(400).json({
          status: 400,
          message: "Semua kolom harus diisi.",
        });
      }
      if (!coordinate.longitude || !coordinate.latitude) {
        return res.status(400).json({
          status: 400,
          message: "Longitude dan latitude diperlukan.",
        });
      }

      const newReport = new Reports(req.body);
      const savedReport = await newReport.save();

      res.status(201).json({
        status: 201,
        data: savedReport,
        message: "Laporan berhasil dibuat",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  },
];

// GET ALL REPORTS
export const getAllReports = [
  verifyToken,
  async (req, res) => {
    try {
      const reports = await Reports.find();
      if (reports.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "Laporan tidak ditemukan",
        });
      }
      res.status(200).json({
        status: 200,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  },
];

// EDIT REPORT
export const editReport = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validasi ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 400,
          message: "ID laporan tidak valid.",
        });
      }

      const updatedReport = await Reports.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedReport) {
        return res.status(404).json({
          status: 404,
          message: "Laporan tidak ditemukan.",
        });
      }

      res.status(200).json({
        status: 200,
        data: updatedReport,
        message: "Laporan berhasil diperbarui",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  },
];

// DELETE REPORT
export const deleteReport = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validasi ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: 400,
          message: "ID laporan tidak valid.",
        });
      }

      const deletedReport = await Reports.findByIdAndDelete(id);
      if (!deletedReport) {
        return res.status(404).json({
          status: 404,
          message: "Laporan tidak ditemukan.",
        });
      }

      res.status(200).json({
        status: 200,
        data: deletedReport,
        message: "Laporan berhasil dihapus.",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  },
];

// GET BY REPORTER ID
export const getByReporterID = [
  verifyToken,
  async (req, res) => {
    try {
      const { reporterID } = req.params;

      // Validasi input
      if (!reporterID) {
        return res.status(400).json({
          status: 400,
          message: "ID Pelapor diperlukan.",
        });
      }

      // Mencari laporan berdasarkan reporterID
      const reports = await Reports.find({ reporterID });

      if (reports.length === 0) {
        return res.status(404).json({
          status: 404,
          message:
            "Tidak ada laporan yang ditemukan untuk ID Pelapor tersebut.",
        });
      }

      res.status(200).json({
        status: 200,
        data: reports,
        message: "Laporan ditemukan",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  },
];
