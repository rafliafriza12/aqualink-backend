import mongoose from "mongoose";

const Meteran = new mongoose.Schema(
  {
    connectionDataId: {
      type: mongoose.Types.ObjectId,
      ref: "ConnectionData",
      default: null,
    },
    noMeteran: {
      type: String,
      required: true,
    },
    kelompokPelangganId: {
      type: mongoose.Types.ObjectId,
      ref: "KelompokPelanggan",
      required: true,
    },
    totalPemakaian: {
      type: Number,
      default: 0,
    },
    pemakaianBelumTerbayar: {
      type: Number,
      default: 0,
    },
    jatuhTempo: {
      type: Date,
      default: null,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Meteran", Meteran);
