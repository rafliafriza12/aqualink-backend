import mongoose from "mongoose";

const RabConnection = new mongoose.Schema(
  {
    connectionDataId: {
      type: mongoose.Types.ObjectId,
      ref: "ConnectionData",
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    technicianId: {
      type: mongoose.Types.ObjectId,
      ref: "Technician",
      required: true,
    },
    totalBiaya: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    rabUrl: {
      type: String,
      required: true,
    },
    catatan: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("RabConnection", RabConnection);
