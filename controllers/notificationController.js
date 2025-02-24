import Notification from "../models/Notification.js";

export const getNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId exists
    if (!userId) {
      return res
        .status(400)
        .json({ status: 400, message: "ID Pengguna diperlukan" });
    }

    // Validate if userId is a valid format
    if (userId.length < 5) {
      return res
        .status(400)
        .json({ status: 400, message: "Format ID Pengguna tidak valid" });
    }

    // Check if notifications exist for this user, sorted by newest first
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    if (notifications.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Tidak ada notifikasi ditemukan untuk pengguna ini",
      });
    }
    res.status(200).json({
      status: 200,
      data: notifications,
      message: "Notifikasi ditemukan",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Kesalahan Server Internal",
    });
  }
};
