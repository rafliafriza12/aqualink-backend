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
    customerType: {
      type: String,
      enum: ["rumah_tangga", "komersial", "industri", "sosial"],
      default: "rumah_tangga",
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
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
    iotConnectionId: {
      type: mongoose.Types.ObjectId,
      ref: "IoTConnection",
      default: null,
    },
    isIoTConnected: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Users", Users);
