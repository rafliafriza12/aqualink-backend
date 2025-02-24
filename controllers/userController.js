import usersModel from "../models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import Wallet from "../models/Wallet.js";
import Notification from "../models/Notification.js";
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

        // Create notification for password change
        const passwordNotification = new Notification({
          userId: id,
          title: "Kata Sandi Diubah",
          message: "Kata sandi akun Anda telah berhasil diubah.",
          category: "INFORMASI",
          link: `/profile/${id}`,
        });

        await passwordNotification.save();

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

      // Create notification for profile update
      const profileNotification = new Notification({
        userId: id,
        title: "Profil Diperbarui",
        message: "Profil akun Anda telah berhasil diperbarui.",
        category: "INFORMASI",
        link: `/profile/${id}`,
      });

      await profileNotification.save();

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

          jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: "1h" },
            async (err, token) => {
              if (err) {
                return res.status(500).json(err);
              }
              user.set("token", token);
              await user.save();

              // Create a notification for successful login
              const loginNotification = new Notification({
                userId: user._id,
                title: "Login Berhasil",
                message: "Anda telah berhasil masuk ke akun Anda.",
                category: "INFORMASI",
              });

              await loginNotification.save();

              return res.status(200).json({
                status: 200,
                data: user,
                token: user.token,
              });
            }
          );
        }
      }
    }
  } catch (error) {
    console.log("Error during login:", error);
    res.status(500).json({
      status: 500,
      message: "Kesalahan server internal",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body; // Assuming userId is sent from the client during logout

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

    // Remove or set token to null
    user.set("token", null);
    await user.save();

    // Create a notification for logout
    const logoutNotification = new Notification({
      userId,
      title: "Logout Berhasil",
      message: "Anda telah berhasil keluar dari akun Anda.",
      category: "INFORMASI",
    });

    await logoutNotification.save();

    return res
      .status(200)
      .json({ status: 200, message: "Pengguna berhasil keluar." });
  } catch (error) {
    console.error("Error during logout:", error);
    res
      .status(500)
      .json({ status: 500, message: "Terjadi kesalahan saat keluar." });
  }
};
