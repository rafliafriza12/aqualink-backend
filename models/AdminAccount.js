import mongoose from "mongoose";

const AdminAccount = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    token: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminAccount", AdminAccount);
