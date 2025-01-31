import Subscribe from "../models/Subscribe.js";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
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

export const getSubscribeByUserId = [
  verifyToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          status: 400,
          message: "User ID is required, but not provided",
        });
      }

      const subscriptions = await Subscribe.aggregate([
        // Match subscriptions for specific user
        {
          $match: {
            "customerDetail.id": userId,
          },
        },
        // Convert waterCreditId to ObjectId if it's stored as string
        {
          $addFields: {
            waterCreditId: { $toObjectId: "$waterCreditId" },
          },
        },
        // Lookup WaterCredits
        {
          $lookup: {
            from: "watercredits", // lowercase collection name
            localField: "waterCreditId",
            foreignField: "_id",
            as: "waterCredit",
          },
        },
        // Unwind the waterCredit array
        {
          $unwind: "$waterCredit",
        },
        // Shape the output data
        {
          $project: {
            subscriptionDetails: {
              totalUsedWater: "$totalUsedWater",
              usedWaterInTempo: "$usedWaterInTempo",
              subscribeStatus: "$subscribeStatus",
              isPipeClose: "$isPipeClose",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
            waterCredit: {
              _id: "$waterCredit._id",
              cost: "$waterCredit.cost",
              perLiter: "$waterCredit.perLiter",
              billingTime: "$waterCredit.billingTime",
              conservationToken: "$waterCredit.conservationToken",
              waterQuality: "$waterCredit.waterQuality",
              income: "$waterCredit.income",
              totalIncome: "$waterCredit.totalIncome",
              withdrawl: "$waterCredit.withdrawl",
              totalUser: "$waterCredit.totalUser",
              location: "$waterCredit.location",
              owner: "$waterCredit.owner",
            },
          },
        },
      ]);

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No subscriptions found for this user",
        });
      }

      return res.status(200).json({
        status: 200,
        message: "Successfully retrieved water credits data",
        data: {
          userId,
          totalSubscriptions: subscriptions.length,
          subscriptions,
        },
      });
    } catch (error) {
      console.error("Error in getSubscribeByUserId:", error);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
        error: error.message,
      });
    }
  },
];

const checkBillingDue = (lastUpdatedAt, billingTime) => {
  const now = new Date();
  const last = new Date(lastUpdatedAt);

  switch (billingTime) {
    case "Perhari":
      return (
        now.getDate() !== last.getDate() || now.getMonth() !== last.getMonth()
      );
    case "Perminggu":
      const weekDiff = Math.floor((now - last) / (1000 * 60 * 60 * 24 * 7));
      return weekDiff >= 1;
    case "Perbulan":
      return (
        now.getMonth() !== last.getMonth() ||
        now.getFullYear() !== last.getFullYear()
      );
    case "Pertahun":
      return now.getFullYear() !== last.getFullYear();
    default:
      return false;
  }
};

export const incrementUsedWater = async (req, res) => {
  try {
    const { userId, waterCreditId } = req.params; // Dapatkan userId dan waterCreditId dari params
    const { usedWater } = req.body; // Ambil usedWater dari body

    // Validasi input
    if (!userId || !waterCreditId || typeof usedWater === "undefined") {
      return res.status(400).json({
        status: 400,
        message: "All fields are required",
      });
    }

    // Cari subscription berdasarkan userId dan waterCreditId
    const subscription = await Subscribe.findOne({
      "customerDetail.id": userId,
      waterCreditId: waterCreditId,
    });

    if (!subscription) {
      return res.status(404).json({
        status: 404,
        message: "Subscription not found",
      });
    }

    // Update usedWaterInTempo terlebih dahulu
    subscription.usedWaterInTempo += usedWater; // Tambahkan nilai baru ke usedWaterInTempo
    await subscription.save(); // Simpan perubahan

    // Cari water credit berdasarkan waterCreditId
    const waterCredit = await WaterCredits.findById(waterCreditId);
    if (!waterCredit) {
      return res.status(404).json({
        status: 404,
        message: "Water credit not found",
      });
    }

    // Cek apakah jatuh tempo pembayaran berdasarkan billingTime
    const isDue = checkBillingDue(
      subscription.updatedAt,
      waterCredit.billingTime
    );
    if (!isDue) {
      // Jika belum jatuh tempo, kembalikan response sukses
      return res.status(200).json({
        status: 200,
        message: "Water usage updated, billing not due yet",
        data: subscription,
      });
    }

    // Jika jatuh tempo, proses pembayaran
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        status: 404,
        message: "Wallet not found",
      });
    }

    const costPerLiter = waterCredit.cost / waterCredit.perLiter;
    const totalCost = subscription.usedWaterInTempo * costPerLiter;
    // Jika saldo tidak mencukupi, bayar sebagian
    let paidWater = subscription.usedWaterInTempo; // Jumlah liter yang akan dibayar
    let actualPayment = totalCost; // Jumlah biaya yang dibayar

    if (wallet.balance < totalCost) {
      paidWater = Math.floor(wallet.balance / costPerLiter); // Hitung liter yang bisa dibayar
      actualPayment = paidWater * costPerLiter; // Biaya aktual berdasarkan liter yang bisa dibayar
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update subscription
      subscription.totalUsedWater += paidWater;
      subscription.usedWaterInTempo -= paidWater; // Sisa air yang belum dibayar
      await subscription.save({ session });

      // Update wallet
      wallet.balance -= actualPayment;
      await wallet.save({ session });

      // Update income pada water credit
      waterCredit.income += actualPayment;
      waterCredit.totalIncome += actualPayment;
      await waterCredit.save({ session });

      await session.commitTransaction();

      res.status(200).json({
        status: 200,
        message:
          wallet.balance >= totalCost
            ? "Billing processed successfully"
            : "Partial payment processed due to insufficient balance",
        data: {
          subscription,
          wallet,
          waterCredit,
          paymentDetails: {
            paidWater,
            actualPayment,
            costPerLiter,
          },
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error handling water usage and billing:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const isBalanceZero = async (req, res) => {
  try {
    const { userId, waterCreditId } = req.params;
    let isPipeClose = false;
    // Validasi input
    if (!userId || !waterCreditId) {
      return res.status(400).json({
        status: 400,
        message: "customerId and waterCreditId are required",
      });
    }

    // Cari wallet berdasarkan userId (customerId)
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      return res.status(404).json({
        status: 404,
        message: "Wallet not found for the given userId",
      });
    }

    // Cek apakah balance 0
    if (wallet.balance === 0) {
      isPipeClose = true;
      // Update isPipeClose menjadi true pada subscription
      const updatedSubscribe = await Subscribe.findOneAndUpdate(
        { "customerDetail.id": userId, waterCreditId },
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

export const getSubscribeByOwnerId = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "Owner ID is required, but not provided",
        });
      }

      const subscriptions = await Subscribe.aggregate([
        // Convert string ID to ObjectId if needed
        {
          $addFields: {
            waterCreditId: { $toObjectId: "$waterCreditId" },
          },
        },
        // Lookup water credits data
        {
          $lookup: {
            from: "watercredits",
            localField: "waterCreditId",
            foreignField: "_id",
            as: "waterCreditInfo",
          },
        },
        // Unwind the array created by lookup
        {
          $unwind: "$waterCreditInfo",
        },
        // Filter by owner ID
        {
          $match: {
            "waterCreditInfo.owner.id": id,
          },
        },
        // Shape the output data
        {
          $project: {
            _id: 1,
            customerDetail: {
              id: "$customerDetail.id",
              fullName: "$customerDetail.fullName",
              email: "$customerDetail.email",
              phone: "$customerDetail.phone",
            },
            waterCredit: {
              id: "$waterCreditId",
              cost: "$waterCreditInfo.cost",
              perLiter: "$waterCreditInfo.perLiter",
              billingTime: "$waterCreditInfo.billingTime",
              waterQuality: "$waterCreditInfo.waterQuality",
              location: "$waterCreditInfo.location",
            },
            subscriptionStats: {
              totalUsedWater: "$totalUsedWater",
              usedWaterInTempo: "$usedWaterInTempo",
              subscribeStatus: "$subscribeStatus",
              isPipeClose: "$isPipeClose",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
          },
        },
        // Sort by creation date (optional)
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "No subscriptions found for this owner",
        });
      }

      return res.status(200).json({
        status: 200,
        message: "Successfully retrieved subscribers data",
        data: {
          totalSubscribers: subscriptions.length,
          subscriptions,
        },
      });
    } catch (err) {
      console.error("Error in getSubscribeByOwnerId:", err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
        error: err.message,
      });
    }
  },
];

export const getSubscribeById = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "Subsribe ID is required, but not provide",
        });
      }

      const subscribe = await Subscribe.findById(id);

      if (!subscribe) {
        return res.status(404).json({
          status: 404,
          message: "Subscriber not found",
        });
      }

      return res.status(200).json({
        status: 200,
        message: "Subscriber not founded",
        data: subscribe,
      });
    } catch (err) {
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  },
];
