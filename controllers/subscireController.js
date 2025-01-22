import Subscribe from "../models/Subscribe.js";
import WaterCredits from "../models/WaterCredits.js";
import { verifyToken } from "../middleware/auth.js";

const createSubscribe = [
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
        message: "Internal server error",
      });
    }
  },
];
