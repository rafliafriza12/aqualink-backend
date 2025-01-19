import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["bank_transfer", "gopay", "credit_card"], // Daftar metode pembayaran yang didukung
  },
  paymentType: { type: String, required: true },
  transactionStatus: {
    type: String,
    required: true,
    enum: ["pending", "success", "failed", "cancelled"], // Status transaksi
    default: "pending",
  },
  customerDetails: {
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
  },
});

export default mongoose.model("TransactionMidtrans", transactionSchema);
