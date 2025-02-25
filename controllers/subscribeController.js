import Subscribe from "../models/Subscribe.js";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
import WaterCredits from "../models/WaterCredits.js";
import { verifyToken } from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import HistoryUsage from "../models/HistoryUsage.js";

const checkNotificationExists = async (userId, title, category) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await Notification.findOne({
    userId,
    title,
    category,
    createdAt: { $gte: today, $lt: tomorrow },
  });
};

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

      // Check if subscription already exists
      const existingSubscription = await Subscribe.findOne({
        "customerDetail.id": customerDetail.id,
        waterCreditId: waterCreditId,
      });

      if (existingSubscription) {
        if (!existingSubscription.subscribeStatus) {
          existingSubscription.subscribeStatus = true;
          await existingSubscription.save();

          const subscribeNotification = new Notification({
            userId: customerDetail.id,
            title: "Langganan Diaktifkan Kembali",
            message:
              "Anda telah berhasil mengaktifkan kembali langganan layanan air.",
            category: "INFORMASI",
          });

          await subscribeNotification.save();

          return res.status(200).json({
            status: 200,
            data: existingSubscription,
            message: "Berhasil mengaktifkan kembali langganan",
          });
        }

        return res.status(400).json({
          status: 400,
          message: "Anda sudah berlangganan layanan air ini",
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
      console.error("Error in createSubscribe:", error);
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal",
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
        {
          $match: {
            "customerDetail.id": userId,
          },
        },
        {
          $addFields: {
            waterCreditId: { $toObjectId: "$waterCreditId" },
          },
        },
        {
          $lookup: {
            from: "watercredits",
            localField: "waterCreditId",
            foreignField: "_id",
            as: "waterCredit",
          },
        },
        {
          $unwind: "$waterCredit",
        },
        {
          $project: {
            subscriptionDetails: {
              totalUsedWater: "$totalUsedWater",
              usedWaterInTempo: "$usedWaterInTempo",
              subscribeStatus: "$subscribeStatus",
              isPipeClose: "$isPipeClose",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
              _id: "$_id",
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

    if (!userId || !waterCreditId || typeof usedWater === "undefined") {
      return res.status(400).json({
        status: 400,
        message: "Semua kolom harus diisi",
      });
    }

    const [subscription, waterCredit, wallet] = await Promise.all([
      Subscribe.findOne({
        "customerDetail.id": userId,
        waterCreditId: waterCreditId,
      }),
      WaterCredits.findById(waterCreditId),
      Wallet.findOne({ userId }),
    ]);

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

    // Check subscription status first
    if (!subscription.subscribeStatus) {
      return res.status(400).json({
        status: 400,
        message: "Langganan tidak aktif",
      });
    }

    const actualUsedWater = usedWater - subscription.totalUsedWater;
    subscription.totalUsedWater = usedWater;
    subscription.usedWaterInTempo += actualUsedWater;

    let historyEntry;
    if (actualUsedWater !== 0) {
      historyEntry = new HistoryUsage({
        userId,
        waterCreditId,
        usedWater: actualUsedWater,
      });
      await Promise.all([historyEntry.save(), subscription.save()]);
    } else {
      await subscription.save();
    }

    const isDue = checkBillingDue(
      subscription.updatedAt,
      waterCredit.billingTime
    );
    if (!isDue) {
      return res.status(200).json({
        status: 200,
        message: "Penggunaan air diperbarui, tagihan belum jatuh tempo",
        data: {
          subscription,
          ...(historyEntry && { history: historyEntry }),
        },
      });
    }

    const costPerLiter = waterCredit.cost / waterCredit.perLiter;
    const totalCost = subscription.usedWaterInTempo * costPerLiter;

    const isTokenRewardDue = checkBillingDue(
      subscription.updatedAt,
      waterCredit.conservationToken.tokenRewardTempo
    );

    let tokenReward = 0;
    if (
      isTokenRewardDue &&
      subscription.usedWaterInTempo < waterCredit.conservationToken.maxWaterUse
    ) {
      tokenReward = waterCredit.conservationToken.rewardToken;
      wallet.conservationToken += tokenReward;
    }

    if (subscription.usedWaterInTempo === 0) {
      return res.status(200).json({
        status: 200,
        message: "Tidak ada penggunaan air untuk ditagih",
        data: {
          subscription,
          ...(historyEntry && { history: historyEntry }),
        },
      });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (wallet.balance < totalCost) {
        const affordableLiters = Math.floor(wallet.balance / costPerLiter);
        const affordableCost = affordableLiters * costPerLiter;
        const remainingLiters =
          subscription.usedWaterInTempo - affordableLiters;

        if (affordableLiters > 0) {
          wallet.balance = 0;
          waterCredit.income += affordableCost;
          waterCredit.totalIncome += affordableCost;
          subscription.usedWaterInTempo = remainingLiters;

          await Promise.all([
            subscription.save({ session }),
            wallet.save({ session }),
            waterCredit.save({ session }),
          ]);
        }

        const existingNotification = await checkNotificationExists(
          userId,
          "Peringatan Saldo",
          "TRANSAKSI"
        );

        if (!existingNotification) {
          const notification = await new Notification({
            userId,
            title: "Peringatan Saldo",
            message: `Tagihan air Anda sebagian telah dibayar untuk ${affordableLiters} liter. Sisa tagihan untuk ${remainingLiters} liter (Rp${
              remainingLiters * costPerLiter
            }) tidak dapat diproses karena saldo tidak mencukupi`,
            category: "TRANSAKSI",
            link: `/billing/${userId}`,
          }).save({ session });

          await session.commitTransaction();

          return res.status(200).json({
            status: 200,
            message:
              "Pembayaran sebagian berhasil, saldo tidak mencukupi untuk pembayaran penuh",
            data: {
              subscription,
              wallet,
              notification,
              ...(historyEntry && { history: historyEntry }),
              paymentDetails: {
                paidLiters: affordableLiters,
                paidAmount: affordableCost,
                remainingLiters,
                remainingCost: remainingLiters * costPerLiter,
                costPerLiter,
                tokenReward,
              },
            },
          });
        }

        await session.commitTransaction();
        return res.status(200).json({
          status: 200,
          message:
            "Pembayaran sebagian berhasil, saldo tidak mencukupi untuk pembayaran penuh",
          data: {
            subscription,
            wallet,
            ...(historyEntry && { history: historyEntry }),
            paymentDetails: {
              paidLiters: affordableLiters,
              paidAmount: affordableCost,
              remainingLiters,
              remainingCost: remainingLiters * costPerLiter,
              costPerLiter,
              tokenReward,
            },
          },
        });
      }

      wallet.balance -= totalCost;
      waterCredit.income += totalCost;
      waterCredit.totalIncome += totalCost;
      subscription.usedWaterInTempo = 0;

      const existingPaymentNotification = await checkNotificationExists(
        userId,
        "Pembayaran Tagihan Air",
        "TRANSAKSI"
      );

      let notification;
      if (!existingPaymentNotification) {
        notification = await new Notification({
          userId,
          title: "Pembayaran Tagihan Air",
          message: `Tagihan air Anda untuk periode ${
            waterCredit.billingTime
          } telah dibayar. Total pembayaran: Rp${totalCost}${
            tokenReward > 0
              ? `. Anda mendapatkan reward token sebesar ${tokenReward} karena penggunaan air yang efisien!`
              : ""
          }`,
          category: "TRANSAKSI",
          link: `/billing/${userId}`,
        }).save({ session });
      }

      await Promise.all([
        subscription.save({ session }),
        wallet.save({ session }),
        waterCredit.save({ session }),
      ]);

      await session.commitTransaction();

      return res.status(200).json({
        status: 200,
        message: "Tagihan berhasil diproses",
        data: {
          subscription,
          wallet,
          waterCredit,
          ...(notification && { notification }),
          ...(historyEntry && { history: historyEntry }),
          paymentDetails: {
            totalCost,
            costPerLiter,
            tokenReward,
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
    });
  }
};

export const isBalanceZero = async (req, res) => {
  try {
    const { userId, waterCreditId } = req.params;
    let isPipeClose = false;

    if (!userId || !waterCreditId) {
      return res.status(400).json({
        status: 400,
        message: "ID pelanggan dan ID kredit air diperlukan",
      });
    }

    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      return res.status(404).json({
        status: 404,
        message: "Dompet tidak ditemukan untuk ID pengguna yang diberikan",
      });
    }

    if (wallet.balance === 0) {
      isPipeClose = true;
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

      const existingNotification = await checkNotificationExists(
        userId,
        "Pipa Ditutup",
        "INFORMASI"
      );

      if (!existingNotification) {
        const pipeCloseNotification = new Notification({
          userId,
          title: "Pipa Ditutup",
          message: "Pipa air Anda telah ditutup karena saldo nol.",
          category: "INFORMASI",
        });

        await pipeCloseNotification.save();
      }

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
        {
          $addFields: {
            waterCreditId: { $toObjectId: "$waterCreditId" },
          },
        },
        {
          $lookup: {
            from: "watercredits",
            localField: "waterCreditId",
            foreignField: "_id",
            as: "waterCreditInfo",
          },
        },
        {
          $unwind: "$waterCreditInfo",
        },
        {
          $match: {
            "waterCreditInfo.owner.id": id,
          },
        },
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

      subscription.subscribeStatus = false;
      await subscription.save();

      await WaterCredits.findByIdAndUpdate(
        waterCreditId,
        { $inc: { totalUser: -1 } },
        { new: true, upsert: false }
      );

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
      });
    }
  },
];
