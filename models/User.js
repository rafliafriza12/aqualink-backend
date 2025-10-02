import mongoose from "mongoose";

const Users = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    token: {
      type: String,
      default: null,
    },
    SambunganDataId: {
      type: mongoose.Types.ObjectId,
      ref: "ConnectionData",
      default: null,
    },
    meteranId: {
      type: mongoose.Types.ObjectId,
      ref: "Meteran",
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Users", Users);
