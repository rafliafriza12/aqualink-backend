import mongoose from "mongoose";

const historyUsageSchema = new mongoose.Schema(
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
    usedWater: {
      type: Number, // Liter per detik dari IoT sensor
      required: true,
    },
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt untuk time-series
  }
);

const HistoryUsage = mongoose.model("HistoryUsage", historyUsageSchema);

export default HistoryUsage;
