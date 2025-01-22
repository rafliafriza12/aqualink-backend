import Subscribe from "../models/Subscribe.js";
import Wallet from "../models/Wallet.js";
import WaterCredits from "../models/WaterCredits.js";
import { verifyToken } from "../middleware/auth.js";

export const createSubscribe = [
  verifyToken,
  async (req, res) => {
    try {
      const { customerDetail, waterCreditId } = req.body;

      if (
        !customerDetail.id ||
        !customerDetail.fullName ||
        !customerDetail.email ||
        !customerDetail.phone ||
        !waterCreditId
      ) {
        return res.status(400).json({
          status: 400,
          message: "All field is required",
        });
      }

      const updatedWaterCredit = await WaterCredits.findByIdAndUpdate(
        waterCreditId,
        { $inc: { totalUser: 1 } },
        { new: true, upsert: false }
      );

      if (!updatedWaterCredit) {
        return res.status(404).json({
          status: 404,
          message: "Water credit not found",
        });
      }

      const newSubscribe = new Subscribe({
        customerDetail,
        waterCreditId,
      });

      await newSubscribe.save();

      return res.status(201).json({
        status: 201,
        data: newSubscribe,
        message: "Subcribe created successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal server error" + error,
      });
    }
  },
];

export const incrementUsedWater = async (req, res) => {
  try {
    const { userId, waterCreditId } = req.params; // Pastikan `waterCreditId` diambil dari params
    const { usedWater } = req.body;

    // Validasi input
    if (!userId || !waterCreditId || !usedWater) {
      return res.status(400).json({
        status: 400,
        message: "All fields are required",
      });
    }

    // Cari dan update data Subscribe berdasarkan userId dan waterCreditId
    const updatedSubscribe = await Subscribe.findOneAndUpdate(
      { "customerDetail.id": userId, waterCreditId: waterCreditId }, // Kondisi pencarian
      { $set: { usedWaterInTempo: usedWater } }, // Increment `usedWaterInTempo`
      { new: true, upsert: false } // Mengembalikan data terbaru setelah update
    );

    // Jika data tidak ditemukan
    if (!updatedSubscribe) {
      return res.status(404).json({
        status: 404,
        message: "Subscription not found",
      });
    }

    // Respon sukses
    res.status(200).json({
      status: 200,
      data: updatedSubscribe,
      message: "Used water updated successfully",
    });
  } catch (err) {
    console.error("Error updating used water:", err);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const isBalanceZero = async (req, res) => {
  try {
    const { customerId, waterCreditId } = req.params;
    let isPipeClose = false;
    // Validasi input
    if (!customerId || !waterCreditId) {
      return res.status(400).json({
        status: 400,
        message: "customerId and waterCreditId are required",
      });
    }

    // Cari wallet berdasarkan userId (customerId)
    const wallet = await Wallet.findOne({ userId: customerId });

    if (!wallet) {
      return res.status(404).json({
        status: 404,
        message: "Wallet not found for the given customerId",
      });
    }

    // Cek apakah balance 0
    if (wallet.balance === 0) {
      isPipeClose = true;
      // Update isPipeClose menjadi true pada subscription
      const updatedSubscribe = await Subscribe.findOneAndUpdate(
        { "customerDetail.id": customerId, waterCreditId },
        { isPipeClose: true },
        { new: true, upsert: false }
      );

      if (!updatedSubscribe) {
        return res.status(404).json({
          status: 404,
          message: "Subscription not found",
        });
      }

      return res.status(200).json({
        status: 200,
        data: isPipeClose,
        message: "Balance is zero, pipe is now closed",
      });
    } else {
      return res.status(200).json({
        status: 200,
        data: isPipeClose,
        message: "Balance is not zero, no changes made to the pipe status",
      });
    }
  } catch (error) {
    console.error("Error in isBalanceZero:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};
