import usersModel from "../models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import Wallet from "../models/Wallet.js";
import { verifyToken } from "../middleware/auth.js";

export const registerUser = async (req, res, next) => {
  try {
    const { email, phone, fullName, password } = req.body;
    if (!email || !phone || !fullName || !password) {
      return res
        .status(400)
        .json({ message: "Silakan isi semua kolom yang diperlukan." });
    } else {
      const isAlreadyRegistered = await usersModel.findOne({ email });
      if (isAlreadyRegistered) {
        return res
          .status(400)
          .json({ message: "Pengguna dengan email ini sudah terdaftar." });
      } else {
        const newUser = new usersModel({
          email,
          phone,
          fullName,
        });

        // Menggunakan promise untuk menangani hash password
        bcryptjs.hash(password, 10, async (err, hash) => {
          if (err) {
            return res.status(500).json(err);
          }

          newUser.set("password", hash);
          await newUser.save(); // Tunggu sampai user disimpan ke DB

          // Setelah user disimpan, buat wallet baru
          const newWallet = new Wallet({
            userId: newUser._id, // Menggunakan _id dari user yang baru dibuat
            balance: 0,
            pendingBalance: 0,
            consevationToken: 0,
          });

          await newWallet.save(); // Tunggu sampai wallet disimpan ke DB

          return res
            .status(200)
            .json({ data: newUser, message: "Pengguna berhasil terdaftar." });
        });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const changePassword = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "ID Pengguna diperlukan, tetapi tidak disediakan",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          status: 400,
          message: "Kata sandi baru diperlukan, tetapi tidak disediakan",
        });
      }

      const user = await usersModel.findById(id);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Pengguna Tidak Ditemukan",
        });
      }

      bcryptjs.hash(newPassword, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json(err);
        }

        user.set("password", hash);
        await user.save();

        return res
          .status(200)
          .json({ data: user, message: "Kata sandi berhasil diubah." });
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Kesalahan Server Internal",
      });
    }
  },
];

export const editProfile = [
  verifyToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newFullName, newEmail } = req.body;

      if (!id) {
        return res.status(400).json({
          status: 400,
          message: "ID Pengguna diperlukan, tetapi tidak disediakan",
        });
      }

      if (!newFullName || !newEmail) {
        return res.status(400).json({
          status: 400,
          message: "Semua kolom diperlukan, tetapi tidak disediakan",
        });
      }

      const emailAlreadyRegistered = await usersModel.findOne({
        email: newEmail,
      });
      const nameAlreadyRegistered = await usersModel.findOne({
        fullName: newFullName,
      });

      if (emailAlreadyRegistered) {
        return res.status(400).json({
          status: 400,
          message: "Email sudah digunakan",
        });
      }

      if (nameAlreadyRegistered) {
        return res.status(400).json({
          status: 400,
          message: "Nama sudah digunakan",
        });
      }

      const user = await usersModel.findById(id);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Pengguna tidak ditemukan",
        });
      }

      user.set("fullName", newFullName);
      user.set("email", newEmail);

      await user.save();

      return res.status(200).json({
        status: 200,
        data: user,
        message: "Profil berhasil diubah",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Kesalahan server internal",
      });
    }
  },
];

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: "Silakan isi semua kolom yang diperlukan.",
      });
    } else {
      const user = await usersModel.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ status: 400, message: "Email atau kata sandi salah." });
      } else {
        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
          res
            .status(400)
            .json({ status: 400, message: "Email atau kata sandi salah." });
        } else {
          const payload = {
            userId: user._id,
            email: user.email,
          };
          const JWT_SECRET = process.env.JWT_SECRET;

          jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
            if (err) {
              return res.status(500).json(err);
            }
            user.set("token", token);
            user.save();
            return res.status(200).json({
              status: 200,
              data: user,
              token: user.token,
            });
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body; // Anggap bahwa userId dikirim dari client saat logout

    if (!userId) {
      return res
        .status(400)
        .json({ status: 400, message: "ID Pengguna diperlukan untuk keluar." });
    }

    const user = await usersModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: 404, message: "Pengguna tidak ditemukan." });
    }

    // Hapus atau atur token menjadi null
    user.set("token", null);
    await user.save();

    return res
      .status(200)
      .json({ status: 200, message: "Pengguna berhasil keluar." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: 500, message: "Terjadi kesalahan saat keluar." });
  }
};
