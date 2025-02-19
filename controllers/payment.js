import { verifyToken } from "../middleware/auth.js";
import TransactionMidtrans from "../models/MidTrans.js";
import snap from "../middleware/midtrans.js";
import { v4 as uuidv4 } from "uuid";
import Wallet from "../models/Wallet.js";

export const createPayment = [
  verifyToken,
  async (req, res, next) => {
    try {
      const { amount, customerDetails, paymentMethod } = req.body;
      const { id } = req.params;

      // Buat orderId menggunakan UUID
      const orderId = uuidv4();

      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "User ID is required, but not provided",
        });
      }

      if (!amount) {
        return res.status(400).json({
          status: 400,
          message: "Isi nominal top up terlebih dahulu",
        });
      }

      if (!customerDetails) {
        return res.status(400).json({
          status: 400,
          message: "Data user dibutuhkan, coba login ulang terlebih dahulu",
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          status: 400,
          message: "Pilih metode pembayaran terlebih dahulu",
        });
      }

      // Data untuk transaksi ke Midtrans
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: customerDetails,
        enabled_payments: [paymentMethod], // Pilih metode pembayaran sesuai yang dipilih user
      };

      // Buat transaksi Snap
      const transaction = await snap.createTransaction(parameter);

      // Simpan transaksi ke database
      const newTransaction = new TransactionMidtrans({
        orderId,
        amount,
        paymentMethod,
        paymentType: "snap", // Default Snap
        transactionStatus: "pending",
        customerDetails,
      });
      await newTransaction.save();

      const wallet = await Wallet.findOneAndUpdate(
        { userId: id }, // mencari berdasarkan userId
        {
          $inc: { pendingBalance: amount }, // menambah pendingBalance sesuai amount
        },
        {
          new: true, // Mengembalikan data terbaru setelah update
          upsert: false, // Tidak membuat document baru jika tidak ditemukan
        }
      );

      // Kirim respons Snap redirect URL
      res.status(201).json({
        message: "Transaction created successfully",
        redirectUrl: transaction.redirect_url, // URL untuk melakukan pembayaran
        snapToken: transaction.token,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: error });
    }
  },
];

export const webhookMidtrans = async (req, res) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;

    // Mencari transaksi berdasarkan orderId
    const transaction = await TransactionMidtrans.findOne({ orderId });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const userId = transaction.customerDetails.userId;
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    // Menangani pembayaran yang berhasil
    if (transactionStatus === "expire") {
      await Wallet.findOneAndUpdate(
        { userId },
        { $set: { pendingBalance: wallet.pendingBalance - transaction.amount } }
      );
    }

    if (transactionStatus === "success") {
      const userId = transaction.customerDetails.userId; // Mengambil userId dari customerDetails

      // Top-up saldo pengguna
      await Wallet.findOneAndUpdate(
        { userId }, // Menemukan wallet berdasarkan userId
        {
          $inc: { balance: transaction.amount }, // Menambahkan saldo dengan pendingBalance
          $set: { pendingBalance: wallet.pendingBalance - transaction.amount }, // Menghapus saldo pending setelah top-up
        }
      );
    }

    // Update status transaksi di collection TransactionMidtrans
    transaction.transactionStatus = transactionStatus;
    await transaction.save();

    // Kirim respon OK untuk Midtrans
    res
      .status(200)
      .json({ message: "Transaction status updated successfully" });
  } catch (error) {
    console.error("Error processing notification:", error);
    res.status(500).json({ message: "Failed to update transaction status" });
  }
};

export const getTransactionByOrderID = [
  verifyToken,
  async (req, res) => {
    try {
      const { orderID } = req.params;

      // Cari transaksi berdasarkan orderId
      const transaction = await TransactionMidtrans.findOne({
        orderId: orderID,
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.status(200).json({
        message: "Transaction found",
        data: transaction,
        status: transaction.transactionStatus,
      });
    } catch (error) {
      console.error("Error fetching transaction status:", error);
      res.status(500).json({ message: "Failed to fetch transaction status" });
    }
  },
];
