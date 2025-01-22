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
          message: "All fields are required.",
        });
      }
      if (!coordinate.longitude || !coordinate.latitude) {
        return res.status(400).json({
          status: 400,
          message: "Longitude and latitude are required.",
        });
      }

      const newReport = new Reports(req.body);
      const savedReport = await newReport.save();

      res.status(201).json({
        status: 201,
        data: savedReport,
        message: "Report created successfull",
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
          message: "reports not found",
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
          message: "Invalid report ID.",
        });
      }

      const updatedReport = await Reports.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedReport) {
        return res.status(404).json({
          status: 404,
          message: "Report not found.",
        });
      }

      res.status(200).json({
        status: 200,
        data: updatedReport,
        message: "Report updated successfull",
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
          message: "Invalid report ID.",
        });
      }

      const deletedReport = await Reports.findByIdAndDelete(id);
      if (!deletedReport) {
        return res.status(404).json({
          status: 404,
          message: "Report not found.",
        });
      }

      res.status(200).json({
        status: 200,
        data: deletedReport,
        message: "Report deleted successfully.",
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
          message: "Reporter ID is required.",
        });
      }

      // Mencari laporan berdasarkan reporterID
      const reports = await Reports.find({ reporterID });

      if (reports.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No reports found for the given Reporter ID.",
        });
      }

      res.status(200).json({
        status: 200,
        data: reports,
        message: "Reports founded",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: error.message,
      });
    }
  },
];
