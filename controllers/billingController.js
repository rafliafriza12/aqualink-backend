import Billing from "../models/Billing.js";
import Meteran from "../models/Meteran.js";
import KelompokPelanggan from "../models/KelompokPelanggan.js";
import HistoryUsage from "../models/HistoryUsage.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import midtransClient from "../middleware/midtrans.js";
import crypto from "crypto";

// Helper function to calculate water bill based on kelompok pelanggan
const calculateWaterBill = (totalPemakaian, kelompokPelanggan) => {
  let biayaAir = 0;

  if (totalPemakaian <= 10) {
    biayaAir = totalPemakaian * kelompokPelanggan.hargaPenggunaanDibawah10;
  } else {
    biayaAir =
      10 * kelompokPelanggan.hargaPenggunaanDibawah10 +
      (totalPemakaian - 10) * kelompokPelanggan.hargaPenggunaanDiatas10;
  }

  const biayaBeban = kelompokPelanggan.biayaBeban || 0;
  const totalTagihan = biayaAir + biayaBeban;

  return { biayaAir, biayaBeban, totalTagihan };
};

// Helper function to get current periode (YYYY-MM)
const getCurrentPeriode = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Helper function to get due date (25th of next month)
const getDueDate = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 25);
  return nextMonth;
};

// Helper function to calculate denda (late fee)
const calculateDenda = (totalTagihan, daysLate) => {
  if (daysLate <= 0) return 0;

  // Denda 2% per bulan keterlambatan (0.066% per hari)
  const dendaPercentage = 0.02;
  const dendaPerMonth = totalTagihan * dendaPercentage;
  const monthsLate = Math.ceil(daysLate / 30);

  return Math.round(dendaPerMonth * monthsLate);
};

// Generate Billing for All Active Meters (Cron Job / Admin)
export const generateMonthlyBilling = async (req, res) => {
  try {
    const { periode } = req.body; // Optional: YYYY-MM, default current month
    const currentPeriode = periode || getCurrentPeriode();

    // Get all active meters
    const meterans = await Meteran.find().populate(
      "kelompokPelangganId userId"
    );

    if (meterans.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Tidak ada meteran aktif",
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const meteran of meterans) {
      try {
        // Check if billing already exists for this periode
        const existingBilling = await Billing.findOne({
          meteranId: meteran._id,
          periode: currentPeriode,
        });

        if (existingBilling) {
          results.skipped.push({
            meteranId: meteran._id,
            noMeteran: meteran.noMeteran,
            reason: "Billing sudah ada untuk periode ini",
          });
          continue;
        }

        // Get previous month's billing to get pemakaianAkhir as pemakaianAwal
        const lastMonth = new Date(currentPeriode + "-01");
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const previousPeriode = `${lastMonth.getFullYear()}-${String(
          lastMonth.getMonth() + 1
        ).padStart(2, "0")}`;

        const previousBilling = await Billing.findOne({
          meteranId: meteran._id,
          periode: previousPeriode,
        });

        const pemakaianAwal = previousBilling
          ? previousBilling.pemakaianAkhir
          : 0;
        const pemakaianAkhir = meteran.totalPemakaian;
        const totalPemakaian = pemakaianAkhir - pemakaianAwal;

        if (totalPemakaian < 0) {
          results.failed.push({
            meteranId: meteran._id,
            noMeteran: meteran.noMeteran,
            reason: "Total pemakaian negatif",
          });
          continue;
        }

        // Calculate billing
        const { biayaAir, biayaBeban, totalTagihan } = calculateWaterBill(
          totalPemakaian,
          meteran.kelompokPelangganId
        );

        const billing = new Billing({
          userId: meteran.userId._id,
          meteranId: meteran._id,
          periode: currentPeriode,
          pemakaianAwal,
          pemakaianAkhir,
          totalPemakaian,
          biayaAir,
          biayaBeban,
          totalTagihan,
          dueDate: getDueDate(),
        });

        await billing.save();

        // Update meteran jatuhTempo only
        // Note: Do NOT increment pemakaianBelumTerbayar here!
        // It's already tracked in real-time by historyUsageController
        // It will be reset to 0 when payment is successful
        meteran.jatuhTempo = getDueDate();
        await meteran.save();

        // Create notification
        const notification = new Notification({
          userId: meteran.userId._id,
          title: "Tagihan Air Baru",
          message: `Tagihan air untuk periode ${currentPeriode} sebesar Rp${totalTagihan.toLocaleString(
            "id-ID"
          )}. Total pemakaian: ${totalPemakaian} m³. Jatuh tempo: ${getDueDate().toLocaleDateString(
            "id-ID"
          )}`,
          category: "TRANSAKSI",
          link: `/pembayaran`,
        });

        await notification.save();

        results.success.push({
          meteranId: meteran._id,
          noMeteran: meteran.noMeteran,
          userId: meteran.userId._id,
          fullName: meteran.userId.fullName,
          totalTagihan,
        });
      } catch (error) {
        results.failed.push({
          meteranId: meteran._id,
          noMeteran: meteran.noMeteran,
          reason: error.message,
        });
      }
    }

    res.status(201).json({
      status: 201,
      message: "Generate billing selesai",
      data: {
        periode: currentPeriode,
        summary: {
          total: meterans.length,
          success: results.success.length,
          failed: results.failed.length,
          skipped: results.skipped.length,
        },
        details: results,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Generate Billing for Single Meter (Admin)
export const generateBillingForMeter = async (req, res) => {
  try {
    const { meteranId } = req.params;
    const { periode } = req.body; // Optional: YYYY-MM
    const currentPeriode = periode || getCurrentPeriode();

    const meteran = await Meteran.findById(meteranId).populate(
      "kelompokPelangganId userId"
    );

    if (!meteran) {
      return res.status(404).json({
        status: 404,
        message: "Meteran tidak ditemukan",
      });
    }

    // Check if billing already exists
    const existingBilling = await Billing.findOne({
      meteranId,
      periode: currentPeriode,
    });

    if (existingBilling) {
      return res.status(400).json({
        status: 400,
        message: "Billing untuk periode ini sudah ada",
      });
    }

    // Get previous month's billing
    const lastMonth = new Date(currentPeriode + "-01");
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const previousPeriode = `${lastMonth.getFullYear()}-${String(
      lastMonth.getMonth() + 1
    ).padStart(2, "0")}`;

    const previousBilling = await Billing.findOne({
      meteranId,
      periode: previousPeriode,
    });

    const pemakaianAwal = previousBilling ? previousBilling.pemakaianAkhir : 0;
    const pemakaianAkhir = meteran.totalPemakaian;
    const totalPemakaian = pemakaianAkhir - pemakaianAwal;

    if (totalPemakaian < 0) {
      return res.status(400).json({
        status: 400,
        message: "Total pemakaian negatif, periksa data meteran",
      });
    }

    // Calculate billing
    const { biayaAir, biayaBeban, totalTagihan } = calculateWaterBill(
      totalPemakaian,
      meteran.kelompokPelangganId
    );

    const billing = new Billing({
      userId: meteran.userId._id,
      meteranId,
      periode: currentPeriode,
      pemakaianAwal,
      pemakaianAkhir,
      totalPemakaian,
      biayaAir,
      biayaBeban,
      totalTagihan,
      dueDate: getDueDate(),
    });

    await billing.save();

    // Update meteran jatuhTempo only
    // Note: Do NOT increment pemakaianBelumTerbayar here!
    // It's already tracked in real-time by historyUsageController
    // It will be reset to 0 when payment is successful
    meteran.jatuhTempo = getDueDate();
    await meteran.save();

    // Create notification
    const notification = new Notification({
      userId: meteran.userId._id,
      title: "Tagihan Air Baru",
      message: `Tagihan air untuk periode ${currentPeriode} sebesar Rp${totalTagihan.toLocaleString(
        "id-ID"
      )}. Total pemakaian: ${totalPemakaian} m³. Jatuh tempo: ${getDueDate().toLocaleDateString(
        "id-ID"
      )}`,
      category: "TRANSAKSI",
      link: `/pembayaran`,
    });

    await notification.save();

    res.status(201).json({
      status: 201,
      message: "Billing berhasil dibuat",
      data: {
        billing,
        notification,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get All Billing (Admin)
export const getAllBilling = async (req, res) => {
  try {
    const { isPaid, periode, userId, meteranId, isOverdue } = req.query;

    let filter = {};
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";
    if (periode) filter.periode = periode;
    if (userId) filter.userId = userId;
    if (meteranId) filter.meteranId = meteranId;
    if (isOverdue !== undefined) filter.isOverdue = isOverdue === "true";

    const billing = await Billing.find(filter)
      .populate("userId", "fullName email phone")
      .populate({
        path: "meteranId",
        populate: {
          path: "kelompokPelangganId",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      count: billing.length,
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get My Billing (User)
export const getMyBilling = async (req, res) => {
  try {
    const userId = req.user.id;

    const billing = await Billing.find({ userId })
      .populate({
        path: "meteranId",
        populate: {
          path: "kelompokPelangganId",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 200,
      count: billing.length,
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Billing by ID
export const getBillingById = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id)
      .populate("userId", "fullName email phone")
      .populate({
        path: "meteranId",
        populate: {
          path: "kelompokPelangganId",
        },
      });

    if (!billing) {
      return res.status(404).json({
        status: 404,
        message: "Billing tidak ditemukan",
      });
    }

    res.status(200).json({
      status: 200,
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Unpaid Billing (User)
export const getUnpaidBilling = async (req, res) => {
  try {
    const userId = req.user.id;

    const unpaidBilling = await Billing.find({
      userId,
      isPaid: false,
    })
      .populate({
        path: "meteranId",
        populate: {
          path: "kelompokPelangganId",
        },
      })
      .sort({ dueDate: 1 });

    // Calculate total with denda if overdue
    let totalUnpaid = 0;
    const now = new Date();

    const billingWithDenda = unpaidBilling.map((bill) => {
      const daysLate = Math.floor(
        (now - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24)
      );
      const denda = calculateDenda(bill.totalTagihan, daysLate);
      const totalWithDenda = bill.totalTagihan + denda;

      totalUnpaid += totalWithDenda;

      return {
        ...bill.toObject(),
        daysLate: daysLate > 0 ? daysLate : 0,
        denda,
        totalWithDenda,
      };
    });

    res.status(200).json({
      status: 200,
      data: {
        bills: billingWithDenda,
        totalUnpaid,
        count: unpaidBilling.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Pay Billing (User) - Manual Payment
export const payBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { paymentMethod } = req.body; // "MANUAL", "TRANSFER", "EWALLET", etc.

    const billing = await Billing.findById(id).populate("meteranId");

    if (!billing) {
      return res.status(404).json({
        status: 404,
        message: "Billing tidak ditemukan",
      });
    }

    // Check if user owns this billing
    if (billing.userId.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: "Anda tidak memiliki akses ke billing ini",
      });
    }

    if (billing.isPaid) {
      return res.status(400).json({
        status: 400,
        message: "Billing sudah dibayar",
      });
    }

    // Calculate denda if overdue
    const now = new Date();
    const daysLate = Math.floor(
      (now - new Date(billing.dueDate)) / (1000 * 60 * 60 * 24)
    );
    const denda = calculateDenda(billing.totalTagihan, daysLate);
    const totalPaid = billing.totalTagihan + denda;

    // Update billing
    billing.isPaid = true;
    billing.paidAt = now;
    billing.paymentMethod = paymentMethod || "MANUAL";
    billing.denda = denda;
    billing.totalTagihan = totalPaid; // Update with denda
    await billing.save();

    // Update meteran - KURANGI pemakaianBelumTerbayar sesuai billing yang dibayar
    const meteran = billing.meteranId;
    // Kurangi usage yang baru dibayar, bukan reset ke 0
    // Karena user mungkin punya tagihan lain yang belum dibayar
    meteran.pemakaianBelumTerbayar = Math.max(
      0,
      meteran.pemakaianBelumTerbayar - billing.totalPemakaian
    );
    await meteran.save();

    // Create notification
    const notification = new Notification({
      userId,
      title: "Pembayaran Berhasil",
      message: `Pembayaran tagihan air periode ${
        billing.periode
      } sebesar Rp${totalPaid.toLocaleString("id-ID")}${
        denda > 0
          ? ` (termasuk denda keterlambatan Rp${denda.toLocaleString("id-ID")})`
          : ""
      } telah berhasil`,
      category: "TRANSAKSI",
      link: `/riwayat-tagihan`,
    });

    await notification.save();

    res.status(200).json({
      status: 200,
      message: "Pembayaran berhasil",
      data: {
        billing,
        notification,
        summary: {
          periode: billing.periode,
          biayaAir: billing.biayaAir,
          biayaBeban: billing.biayaBeban,
          denda,
          totalPaid,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Pay All Unpaid Billing (User) - Manual Payment for Multiple Bills
export const payAllBilling = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod } = req.body; // "MANUAL", "TRANSFER", "EWALLET", etc.

    // Get all unpaid billing for this user
    const unpaidBillings = await Billing.find({
      userId,
      isPaid: false,
    })
      .populate("meteranId")
      .sort({ dueDate: 1 });

    if (unpaidBillings.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Tidak ada tagihan yang belum dibayar",
      });
    }

    const now = new Date();
    let totalPaid = 0;
    let totalDenda = 0;
    let totalPemakaian = 0;
    const paidBillings = [];

    // Process each billing
    for (const billing of unpaidBillings) {
      // Calculate denda if overdue
      const daysLate = Math.floor(
        (now - new Date(billing.dueDate)) / (1000 * 60 * 60 * 24)
      );
      const denda = calculateDenda(billing.totalTagihan, daysLate);
      const amountWithDenda = billing.totalTagihan + denda;

      // Update billing
      billing.isPaid = true;
      billing.paidAt = now;
      billing.paymentMethod = paymentMethod || "MANUAL";
      billing.denda = denda;
      billing.totalTagihan = amountWithDenda;
      await billing.save();

      totalPaid += amountWithDenda;
      totalDenda += denda;
      totalPemakaian += billing.totalPemakaian;

      paidBillings.push({
        periode: billing.periode,
        biayaAir: billing.biayaAir,
        biayaBeban: billing.biayaBeban,
        denda,
        total: amountWithDenda,
      });
    }

    // Update meteran - KURANGI pemakaianBelumTerbayar sesuai total usage yang dibayar
    const meteran = unpaidBillings[0].meteranId;
    meteran.pemakaianBelumTerbayar = Math.max(
      0,
      meteran.pemakaianBelumTerbayar - totalPemakaian
    );
    await meteran.save();

    // Create notification
    const notification = new Notification({
      userId,
      title: "Pembayaran Berhasil",
      message: `Pembayaran ${
        unpaidBillings.length
      } tagihan air berhasil! Total: Rp${totalPaid.toLocaleString("id-ID")}${
        totalDenda > 0
          ? ` (termasuk denda Rp${totalDenda.toLocaleString("id-ID")})`
          : ""
      }`,
      category: "TRANSAKSI",
      link: `/riwayat-tagihan`,
    });

    await notification.save();

    res.status(200).json({
      status: 200,
      message: "Pembayaran semua tagihan berhasil",
      data: {
        totalBills: unpaidBillings.length,
        totalPemakaian,
        totalDenda,
        totalPaid,
        bills: paidBillings,
        notification,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Create Payment with Midtrans (User)
export const createPayment = async (req, res) => {
  try {
    const { id } = req.params; // billing ID
    const userId = req.user.id;

    const billing = await Billing.findById(id)
      .populate("meteranId")
      .populate("userId", "fullName email phone");

    if (!billing) {
      return res.status(404).json({
        status: 404,
        message: "Billing tidak ditemukan",
      });
    }

    // Check if user owns this billing
    if (billing.userId._id.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: "Anda tidak memiliki akses ke billing ini",
      });
    }

    if (billing.isPaid) {
      return res.status(400).json({
        status: 400,
        message: "Billing sudah dibayar",
      });
    }

    // Calculate denda if overdue
    const now = new Date();
    const daysLate = Math.floor(
      (now - new Date(billing.dueDate)) / (1000 * 60 * 60 * 24)
    );
    const denda = calculateDenda(billing.totalTagihan, daysLate);
    const grossAmount = billing.totalTagihan + denda;

    // Create transaction ID (format harus BILLING-{billingId} untuk webhook)
    const orderId = `BILLING-${billing._id}`;

    // Midtrans parameter
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: billing.userId.fullName,
        email: billing.userId.email,
        phone: billing.userId.phone || "08123456789",
      },
      item_details: [
        {
          id: `billing-${billing._id}`,
          price: billing.biayaAir,
          quantity: 1,
          name: `Biaya Air - Periode ${billing.periode}`,
        },
        {
          id: `beban-${billing._id}`,
          price: billing.biayaBeban,
          quantity: 1,
          name: "Biaya Beban",
        },
      ],
      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/finish`,
        error: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/error`,
        pending: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/pending`,
      },
    };

    // Add denda if exists
    if (denda > 0) {
      parameter.item_details.push({
        id: `denda-${billing._id}`,
        price: denda,
        quantity: 1,
        name: "Denda Keterlambatan",
      });
    }

    // Create Snap transaction
    const transaction = await midtransClient.createTransaction(parameter);

    // Save transaction to database
    const newTransaction = new Transaction({
      userId: billing.userId._id,
      billingId: billing._id,
      orderId: orderId,
      grossAmount: grossAmount,
      status: "pending",
      snapToken: transaction.token,
      snapRedirectUrl: transaction.redirect_url,
    });

    await newTransaction.save();

    res.status(201).json({
      status: 201,
      message: "Payment link berhasil dibuat",
      data: {
        orderId: orderId,
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        billing: {
          periode: billing.periode,
          biayaAir: billing.biayaAir,
          biayaBeban: billing.biayaBeban,
          denda: denda,
          totalAmount: grossAmount,
        },
      },
    });
  } catch (error) {
    console.error("Midtrans error:", error);
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Create Payment with Midtrans for ALL Unpaid Bills (User)
export const createPaymentForAllBills = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unpaid billing
    const unpaidBillings = await Billing.find({
      userId,
      isPaid: false,
    })
      .populate("meteranId")
      .sort({ dueDate: 1 });

    if (unpaidBillings.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Tidak ada tagihan yang belum dibayar",
      });
    }

    // Get user data
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User tidak ditemukan",
      });
    }

    // Calculate total amount with denda
    const now = new Date();
    let grossAmount = 0;
    const item_details = [];
    const billingIds = [];

    for (const billing of unpaidBillings) {
      const daysLate = Math.floor(
        (now - new Date(billing.dueDate)) / (1000 * 60 * 60 * 24)
      );
      const denda = calculateDenda(billing.totalTagihan, daysLate);

      grossAmount += billing.totalTagihan + denda;
      billingIds.push(billing._id);

      // Add item details for each billing
      item_details.push({
        id: `billing-${billing._id}`,
        price: billing.biayaAir,
        quantity: 1,
        name: `Biaya Air - ${billing.periode}`,
      });

      item_details.push({
        id: `beban-${billing._id}`,
        price: billing.biayaBeban,
        quantity: 1,
        name: `Biaya Beban - ${billing.periode}`,
      });

      if (denda > 0) {
        item_details.push({
          id: `denda-${billing._id}`,
          price: denda,
          quantity: 1,
          name: `Denda - ${billing.periode}`,
        });
      }
    }

    // Create transaction ID with multiple billing IDs
    // Format: BILLING-MULTI-{userId}-{timestamp}
    const orderId = `BILLING-MULTI-${userId}-${Date.now()}`;

    // Midtrans parameter
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.fullName,
        email: user.email,
        phone: user.phone || "08123456789",
      },
      item_details: item_details,
      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/finish`,
        error: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/error`,
        pending: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/pending`,
      },
      custom_field1: JSON.stringify(billingIds), // Store billing IDs for webhook
    };

    // Create Snap transaction
    const transaction = await midtransClient.createTransaction(parameter);

    // Save transaction to database (use first billing ID as reference)
    const newTransaction = new Transaction({
      userId: userId,
      billingId: unpaidBillings[0]._id, // Reference to first billing
      orderId: orderId,
      grossAmount: grossAmount,
      status: "pending",
      snapToken: transaction.token,
      snapRedirectUrl: transaction.redirect_url,
      notes: `Pembayaran ${unpaidBillings.length} tagihan sekaligus`,
    });

    await newTransaction.save();

    res.status(201).json({
      status: 201,
      message: "Payment link untuk semua tagihan berhasil dibuat",
      data: {
        orderId: orderId,
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        summary: {
          totalBills: unpaidBillings.length,
          totalAmount: grossAmount,
          bills: unpaidBillings.map((b) => ({
            periode: b.periode,
            totalTagihan: b.totalTagihan,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Midtrans error:", error);
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

/**
 * ============================================================================
 * NOTE: Midtrans Webhook Handler telah dipindahkan ke paymentWebhookController.js
 * ============================================================================
 *
 * Endpoint: POST /webhook/payment
 *
 * Webhook tersebut menangani semua jenis pembayaran Midtrans:
 * - Single billing payment (order_id format: BILLING-{billingId})
 * - Multiple billing payment (order_id format: BILLING-MULTI-{userId}-{timestamp})
 * - RAB connection payment (order_id format: RAB-{rabId})
 * - Wallet top-up (ditangani oleh payment.js controller di /midtrans/notification)
 *
 * Fungsi midtransWebhook dan handleMultipleBillingWebhook telah dihapus dari
 * billingController.js untuk menghindari duplikasi dan konflik.
 *
 * Semua transaksi pembayaran billing sekarang diproses melalui:
 * - paymentWebhookController.js untuk webhook dari Midtrans
 * - Routing otomatis berdasarkan format order_id
 * ============================================================================
 */

// Update Payment Status (Admin)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, paymentMethod, notes } = req.body;

    const billing = await Billing.findById(id).populate("meteranId");

    if (!billing) {
      return res.status(404).json({
        status: 404,
        message: "Billing tidak ditemukan",
      });
    }

    const wasPaid = billing.isPaid;

    // Calculate denda if marking as paid and overdue
    let denda = 0;
    if (isPaid && !wasPaid) {
      const now = new Date();
      const daysLate = Math.floor(
        (now - new Date(billing.dueDate)) / (1000 * 60 * 60 * 24)
      );
      denda = calculateDenda(billing.totalTagihan, daysLate);
    }

    // Update billing
    billing.isPaid = isPaid;
    billing.paidAt = isPaid ? new Date() : null;
    billing.paymentMethod = paymentMethod || billing.paymentMethod;
    billing.notes = notes || billing.notes;
    billing.denda = isPaid ? denda : 0;
    if (isPaid && denda > 0) {
      billing.totalTagihan = billing.totalTagihan + denda;
    }
    await billing.save();

    // Update meteran
    const meteran = billing.meteranId;
    if (isPaid && !wasPaid) {
      // Payment successful: kurangi pemakaianBelumTerbayar sesuai billing yang dibayar
      // Bukan reset ke 0 karena mungkin ada tagihan lain yang belum dibayar
      meteran.pemakaianBelumTerbayar = Math.max(
        0,
        meteran.pemakaianBelumTerbayar - billing.totalPemakaian
      );
    } else if (!isPaid && wasPaid) {
      // Payment cancelled: restore pemakaianBelumTerbayar
      // Add back the usage that was billed
      meteran.pemakaianBelumTerbayar += billing.totalPemakaian;
    }
    await meteran.save();

    // Create notification
    const notification = new Notification({
      userId: billing.userId,
      title: isPaid ? "Pembayaran Berhasil" : "Status Pembayaran Diubah",
      message: isPaid
        ? `Pembayaran tagihan air periode ${
            billing.periode
          } sebesar Rp${billing.totalTagihan.toLocaleString("id-ID")}${
            denda > 0
              ? ` (termasuk denda Rp${denda.toLocaleString("id-ID")})`
              : ""
          } telah berhasil`
        : `Status pembayaran tagihan air periode ${billing.periode} telah diubah`,
      category: "TRANSAKSI",
      link: isPaid ? `/riwayat-tagihan` : `/pembayaran`,
    });

    await notification.save();

    res.status(200).json({
      status: 200,
      message: "Status pembayaran berhasil diupdate",
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Check and Update Overdue Status (Cron Job)
export const updateOverdueStatus = async (req, res) => {
  try {
    const now = new Date();

    // Find all unpaid billing past due date
    const overdueBillings = await Billing.find({
      isPaid: false,
      dueDate: { $lt: now },
      isOverdue: false,
    });

    let updated = 0;
    for (const billing of overdueBillings) {
      billing.isOverdue = true;
      await billing.save();

      // Send overdue notification
      const notification = new Notification({
        userId: billing.userId,
        title: "Tagihan Terlambat",
        message: `Tagihan air periode ${
          billing.periode
        } sebesar Rp${billing.totalTagihan.toLocaleString(
          "id-ID"
        )} telah melewati jatuh tempo. Segera lakukan pembayaran untuk menghindari denda.`,
        category: "PERINGATAN",
        link: `/pembayaran`,
      });

      await notification.save();
      updated++;
    }

    res.status(200).json({
      status: 200,
      message: "Update status overdue selesai",
      data: {
        updated,
        total: overdueBillings.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Monthly Report (Admin)
export const getMonthlyReport = async (req, res) => {
  try {
    const { periode } = req.params;

    const billing = await Billing.find({ periode })
      .populate("userId", "fullName email")
      .populate({
        path: "meteranId",
        populate: {
          path: "kelompokPelangganId",
        },
      });

    const totalPemakaian = billing.reduce(
      (sum, b) => sum + b.totalPemakaian,
      0
    );
    const totalTagihan = billing.reduce((sum, b) => sum + b.totalTagihan, 0);
    const totalPaid = billing
      .filter((b) => b.isPaid)
      .reduce((sum, b) => sum + b.totalTagihan, 0);
    const totalUnpaid = billing
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + b.totalTagihan, 0);
    const totalDenda = billing.reduce((sum, b) => sum + (b.denda || 0), 0);

    res.status(200).json({
      status: 200,
      data: {
        periode,
        summary: {
          totalPelanggan: billing.length,
          totalPemakaian,
          totalTagihan,
          totalPaid,
          totalUnpaid,
          totalDenda,
          pelangganBayar: billing.filter((b) => b.isPaid).length,
          pelangganBelumBayar: billing.filter((b) => !b.isPaid).length,
        },
        details: billing,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Delete Billing (Admin)
export const deleteBilling = async (req, res) => {
  try {
    const { id } = req.params;

    const billing = await Billing.findById(id);

    if (!billing) {
      return res.status(404).json({
        status: 404,
        message: "Billing tidak ditemukan",
      });
    }

    // Note: We don't need to adjust meteran.pemakaianBelumTerbayar when deleting billing
    // because pemakaianBelumTerbayar is tracked in real-time by historyUsageController
    // It's not affected by billing creation or deletion
    // It's only reset to 0 when payment is successful

    await Billing.findByIdAndDelete(id);

    res.status(200).json({
      status: 200,
      message: "Billing berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
