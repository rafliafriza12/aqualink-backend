import Wallet from "../models/Wallet.js";
import { verifyToken } from "../middleware/auth.js";
export const getWalletByUserId = [
  verifyToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          status: 400,
          message: "ID Pengguna diperlukan, tetapi tidak disediakan",
        });
      }

      const wallet = await Wallet.findOne({ userId: userId });

      if (!wallet) {
        return res.status(404).json({
          status: 404,
          message: "Dompet tidak ditemukan",
        });
      }

      return res.status(200).json({
        status: 200,
        data: wallet,
        message: "Dompet ditemukan",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal",
      });
    }
  },
];
