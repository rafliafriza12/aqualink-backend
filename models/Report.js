import mongoose from "mongoose";

const Reports = new mongoose.Schema(
  {
    reporterID: {
      type: String,
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    problem: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    coordinate: {
      longitude: {
        type: Number,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      required: true,
      default: "Menunggu konfirmasi",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Reports", Reports);
