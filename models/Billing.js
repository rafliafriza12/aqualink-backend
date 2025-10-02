import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    meteranId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meteran",
      required: true,
    },
    periode: {
      type: String, // Format: YYYY-MM
      required: true,
    },
    pemakaianAwal: {
      type: Number, // m³ atau liter (awal bulan)
      required: true,
    },
    pemakaianAkhir: {
      type: Number, // m³ atau liter (akhir bulan)
      required: true,
    },
    totalPemakaian: {
      type: Number, // m³ atau liter
      required: true,
    },
    biayaAir: {
      type: Number, // Rupiah
      required: true,
    },
    biayaBeban: {
      type: Number, // Rupiah (biaya tetap)
      required: true,
    },
    totalTagihan: {
      type: Number, // Rupiah
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String, // "MANUAL", "TRANSFER", "EWALLET", etc.
      default: null,
    },
    dueDate: {
      type: Date, // Tanggal jatuh tempo
      required: true,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    denda: {
      type: Number, // Rupiah (denda keterlambatan)
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk query cepat
billingSchema.index({ userId: 1, periode: 1 });
billingSchema.index({ meteranId: 1, periode: 1 });
billingSchema.index({ isPaid: 1, dueDate: 1 });

const Billing = mongoose.model("Billing", billingSchema);

export default Billing;
