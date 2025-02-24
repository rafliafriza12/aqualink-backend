import mongoose from "mongoose";

const Notifications = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", Notifications);
