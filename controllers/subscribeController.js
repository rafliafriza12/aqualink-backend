import Subscribe from "../models/Subscribe.js";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
import WaterCredits from "../models/WaterCredits.js";
import { verifyToken } from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import HistoryUsage from "../models/HistoryUsage.js";

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
          message: "Semua kolom harus diisi",
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
          message: "Kredit air tidak ditemukan",
        });
      }

      const newSubscribe = new Subscribe({
        customerDetail,
        waterCreditId,
      });

      await newSubscribe.save();

      // Create a notification for successful subscription
      const subscribeNotification = new Notification({
        userId: customerDetail.id,
        title: "Langganan Dibuat",
        message: "Anda telah berhasil berlangganan layanan air.",
        category: "INFORMASI",
      });

      await subscribeNotification.save();

      return res.status(201).json({
        status: 201,
        data: newSubscribe,
        message: "Berhasil membuat langganan",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal" + error,
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
          message: "ID Pengguna diperlukan, tetapi tidak disediakan",
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
          message: "Tidak ada langganan yang ditemukan untuk pengguna ini",
        });
      }

      return res.status(200).json({
        status: 200,
        message: "Berhasil mengambil data kredit air",
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
        message: "Kesalahan server internal",
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
    const { userId, waterCreditId } = req.params;
    const { usedWater } = req.body;

    // Validate input
    if (!userId || !waterCreditId || typeof usedWater === "undefined") {
      return res.status(400).json({
        status: 400,
        message: "Semua kolom harus diisi",
      });
    }

    // Find subscription and water credit in parallel
    const [subscription, waterCredit, wallet] = await Promise.all([
      Subscribe.findOne({
        "customerDetail.id": userId,
        waterCreditId: waterCreditId,
      }),
      WaterCredits.findById(waterCreditId),
      Wallet.findOne({ userId }),
    ]);

    // Validate resources exist
    if (!subscription || !waterCredit || !wallet) {
      return res.status(404).json({
        status: 404,
        message: !subscription
          ? "Langganan tidak ditemukan"
          : !waterCredit
          ? "Kredit air tidak ditemukan"
          : "Dompet tidak ditemukan",
      });
    }

    // Update usage and save history
    subscription.usedWaterInTempo += usedWater;
    subscription.totalUsedWater += usedWater;
    const historyEntry = new HistoryUsage({ userId, waterCreditId, usedWater });
    await Promise.all([historyEntry.save(), subscription.save()]);

    // Return early if no billing is due
    const isDue = checkBillingDue(
      subscription.updatedAt,
      waterCredit.billingTime
    );
    if (!isDue) {
      return res.status(200).json({
        status: 200,
        message: "Penggunaan air diperbarui, tagihan belum jatuh tempo",
        data: { subscription, history: historyEntry },
      });
    }

    // Process payment
    const costPerLiter = waterCredit.cost / waterCredit.perLiter;
    const totalCost = subscription.usedWaterInTempo * costPerLiter;
    const paidWater =
      wallet.balance < totalCost
        ? Math.floor(wallet.balance / costPerLiter)
        : subscription.usedWaterInTempo;
    const actualPayment = paidWater * costPerLiter;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Update balances
      subscription.usedWaterInTempo -= paidWater;
      wallet.balance -= actualPayment;
      waterCredit.income += actualPayment;
      waterCredit.totalIncome += actualPayment;

      // Create notifications
      const notifications = await Promise.all([
        new Notification({
          userId,
          title: "Tagihan Air Jatuh Tempo",
          message: `Tagihan air Anda untuk periode ${waterCredit.billingTime} telah jatuh tempo. Total tagihan: Rp${totalCost}`,
          category: "TRANSAKSI",
          link: `/billing/${userId}`,
        }).save({ session }),
        new Notification({
          userId,
          title: "Pemotongan Saldo",
          message: `Saldo Anda telah dipotong sebesar Rp${actualPayment} untuk pembayaran tagihan air periode ${waterCredit.billingTime}`,
          category: "TRANSAKSI",
          link: `/billing/${userId}`,
        }).save({ session }),
      ]);

      // Save all changes
      await Promise.all([
        subscription.save({ session }),
        wallet.save({ session }),
        waterCredit.save({ session }),
      ]);

      await session.commitTransaction();

      return res.status(200).json({
        status: 200,
        message:
          wallet.balance >= totalCost
            ? "Tagihan berhasil diproses"
            : "Pembayaran sebagian diproses karena saldo tidak mencukupi",
        data: {
          subscription,
          wallet,
          waterCredit,
          notifications: {
            billing: notifications[0],
            payment: notifications[1],
          },
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
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
      error: error.message,
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
        message: "ID pelanggan dan ID kredit air diperlukan",
      });
    }

    // Cari wallet berdasarkan userId (customerId)
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      return res.status(404).json({
        status: 404,
        message: "Dompet tidak ditemukan untuk ID pengguna yang diberikan",
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
          message: "Langganan tidak ditemukan",
        });
      }

      // Create notification for pipe closure
      const pipeCloseNotification = new Notification({
        userId,
        title: "Pipa Ditutup",
        message: "Pipa air Anda telah ditutup karena saldo nol.",
        category: "INFORMASI",
      });

      await pipeCloseNotification.save();

      return res.status(200).json({
        status: 200,
        data: isPipeClose,
        message: "Saldo habis, pipa sekarang ditutup",
      });
    } else {
      return res.status(200).json({
        status: 200,
        data: isPipeClose,
        message: "Saldo tidak nol, tidak ada perubahan pada status pipa",
      });
    }
  } catch (error) {
    console.error("Error in isBalanceZero:", error);
    res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
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
          message: "ID pemilik diperlukan, tetapi tidak disediakan",
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
          message: "Tidak ada langganan yang ditemukan untuk pemilik ini",
        });
      }

      return res.status(200).json({
        status: 200,
        message: "Berhasil mengambil data pelanggan",
        data: {
          totalSubscribers: subscriptions.length,
          subscriptions,
        },
      });
    } catch (err) {
      console.error("Error in getSubscribeByOwnerId:", err);
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal",
        error: err.message,
      });
    }
  },
];

export const getSubscribeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 400,
        message: "ID langganan diperlukan, tetapi tidak disediakan",
      });
    }

    const subscribe = await Subscribe.findById(id);

    if (!subscribe) {
      return res.status(404).json({
        status: 404,
        message: "Pelanggan tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Pelanggan ditemukan",
      data: subscribe,
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

export const unsubscribe = [
  verifyToken,
  async (req, res) => {
    try {
      const { userId, waterCreditId } = req.params;

      if (!userId || !waterCreditId) {
        return res.status(400).json({
          status: 400,
          message: "ID Pengguna dan ID Kredit Air diperlukan.",
        });
      }

      // Find the subscription
      const subscription = await Subscribe.findOne({
        "customerDetail.id": userId,
        waterCreditId: waterCreditId,
      });

      if (!subscription) {
        return res.status(404).json({
          status: 404,
          message: "Langganan tidak ditemukan.",
        });
      }

      // Update the subscription status to inactive or remove it
      subscription.subscribeStatus = false; // or use subscription.remove() to delete
      await subscription.save();

      // Optionally, update the totalUser count in WaterCredits
      await WaterCredits.findByIdAndUpdate(
        waterCreditId,
        { $inc: { totalUser: -1 } },
        { new: true, upsert: false }
      );

      // Optionally, create a notification for the user
      const unsubscribeNotification = new Notification({
        userId,
        title: "Berhenti Berlangganan",
        message: "Anda telah berhasil berhenti berlangganan dari layanan air.",
        category: "INFORMASI",
      });

      await unsubscribeNotification.save();

      return res.status(200).json({
        status: 200,
        message: "Berhasil berhenti berlangganan.",
        data: subscription,
      });
    } catch (error) {
      console.error("Error in unsubscribe:", error);
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal",
        error: error.message,
      });
    }
  },
];
