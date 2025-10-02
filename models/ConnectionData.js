import mongoose from "mongoose";

const ConnectionData = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    nik: {
      type: String,
      required: true,
    },
    nikUrl: {
      type: String,
      required: true,
    },
    noKK: {
      type: String,
      required: true,
    },
    kkUrl: {
      type: String,
      required: true,
    },
    alamat: {
      type: String,
      required: true,
    },
    kecamatan: {
      type: String,
      required: true,
    },
    kelurahan: {
      type: String,
      required: true,
    },
    noImb: {
      type: String,
      required: true,
    },
    imbUrl: {
      type: String,
      required: true,
    },
    luasBangunan: {
      type: Number,
      required: true,
    },
    isVerifiedByData: {
      type: Boolean,
      default: false,
    },
    isVerifiedByTechnician: {
      type: Boolean,
      default: false,
    },
    surveiId: {
      type: mongoose.Types.ObjectId,
      ref: "SurveyData",
      default: null,
    },
    rabConnectionId: {
      type: mongoose.Types.ObjectId,
      ref: "RabConnection",
      default: null,
    },
    isAllProcedureDone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ConnectionData", ConnectionData);
