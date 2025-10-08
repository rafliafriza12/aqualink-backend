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
    nik: {
      type: String,
      default: null,
      sparse: true, // Allow multiple null values
      unique: true,
    },
    phone: {
      type: String,
      default: null,
    },
    address: {
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
    gender: {
      type: String,
      enum: ["L", "P"],
      default: null,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    occupation: {
      type: String,
      default: null,
    },
    location: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      address: {
        type: String,
        default: null,
      },
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
