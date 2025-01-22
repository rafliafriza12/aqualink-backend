import WaterCredits from "../models/WaterCredits.js";
import { verifyToken } from "../middleware/auth.js";

export const getWaterCreditByOwnerId = [
  verifyToken,
  async (req, res) => {
    try {
      const { ownerId } = req.params; // Perbaikan destrukturisasi

      if (!ownerId) {
        return res.status(400).json({
          status: 400,
          message: "Owner ID is required but not provided.",
        });
      }

      // Cari water credits berdasarkan owner.id
      const waterCredits = await WaterCredits.find({ "owner.id": ownerId });
      if (waterCredits.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No water credit found for the given owner ID.",
        });
      }

      // Kirim respons dengan data yang ditemukan
      res.status(200).json({
        status: 200,
        data: waterCredits,
        message: `${waterCredits.length} ${
          waterCredits.length === 1 ? "Water credit" : "Water credits"
        } found.`,
      });
    } catch (error) {
      // Tangani error dan kirimkan respons
      res.status(500).json({
        status: 500,
        message: "An error occurred while retrieving water credits.",
        error: error.message,
      });
    }
  },
];

export const createWaterCredit = [
  verifyToken,
  async (req, res) => {
    try {
      const {
        owner,
        cost,
        perLiter,
        billingTime,
        conservationToken,
        waterQuality,
        income,
        totalIncome,
        withdrawl,
        totalUser,
        location,
      } = req.body;

      // Validasi input
      if (!owner || !cost || !perLiter || !location) {
        return res.status(400).json({
          status: 400,
          message: "Required fields are missing.",
        });
      }

      // Buat dokumen baru
      const newWaterCredit = new WaterCredits({
        owner,
        cost,
        perLiter,
        billingTime,
        conservationToken,
        waterQuality,
        income,
        totalIncome,
        withdrawl,
        totalUser,
        location,
      });

      // Simpan ke database
      await newWaterCredit.save();

      res.status(201).json({
        status: 201,
        message: "Water credit created successfully.",
        data: newWaterCredit,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "An error occurred while creating water credit.",
        error: error.message,
      });
    }
  },
];

export const editWaterCredit = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params; // Ambil ID dari parameter
      const updates = req.body; // Data yang akan diupdate

      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "ID is required but not provided.",
        });
      }

      // Update dokumen
      const updatedWaterCredit = await WaterCredits.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );

      if (!updatedWaterCredit) {
        return res.status(404).json({
          status: 404,
          message: "Water credit not found.",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Water credit updated successfully.",
        data: updatedWaterCredit,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "An error occurred while updating water credit.",
        error: error.message,
      });
    }
  },
];

export const deleteWaterCredit = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "ID is required but not provided.",
        });
      }

      // Hapus dokumen
      const deletedWaterCredit = await WaterCredits.findByIdAndDelete(id);

      if (!deletedWaterCredit) {
        return res.status(404).json({
          status: 404,
          message: "Water credit not found.",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Water credit deleted successfully.",
        data: deletedWaterCredit,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "An error occurred while deleting water credit.",
        error: error.message,
      });
    }
  },
];

export const getAllWaterCredit = [
  verifyToken,
  async (req, res) => {
    try {
      const waterCredits = await WaterCredits.find();

      if (waterCredits.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No data yet",
        });
      }

      res.status(200).json({
        status: 200,
        data: waterCredits,
        message: "Water credit founded",
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "An error occurred while deleting water credit.",
        error: error.message,
      });
    }
  },
];
