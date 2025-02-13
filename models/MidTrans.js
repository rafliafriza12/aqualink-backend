import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
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
      enum: [
        "bank_transfer",
        "gopay",
        "credit_card",
        "bca_klikbca",
        "bca_klikpay",
        "bri_epay",
        "cimb_clicks",
        "danamon_online",
        "qris",
        "shopeepay",
        "akulaku",
        "indomaret",
        "alfamart",
      ],
      default: "pending",
    },
    customerDetails: {
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TransactionMidtrans", transactionSchema);
