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
          message: "User ID is required, but not provide",
        });
      }

      const wallet = await Wallet.findOne({ userId: userId });

      if (!wallet) {
        return res.status(404).json({
          status: 404,
          message: "Wallet not found",
        });
      }

      return res.status(200).json({
        status: 200,
        data: wallet,
        message: "Wallet founded",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  },
];
