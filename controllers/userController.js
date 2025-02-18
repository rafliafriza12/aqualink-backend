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
        .json({ message: "Please fill all required fields." });
    } else {
      const isAlreadyRegistered = await usersModel.findOne({ email });
      if (isAlreadyRegistered) {
        return res
          .status(400)
          .json({ message: "User with this email already exists." });
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
            .json({ data: newUser, message: "User registered successfully." });
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
          message: "User ID is required, but not provided",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          status: 400,
          message: "New password is required, but not provided",
        });
      }

      const user = await usersModel.findById(id);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "User Not Found",
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
          .json({ data: user, message: "Change Password successfully." });
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
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
          message: "User ID is required, but not provided",
        });
      }

      if (!newFullName || !newEmail) {
        return res.status(400).json({
          status: 400,
          message: "All field is required, but not provided",
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
          message: "Email already used",
        });
      }

      if (nameAlreadyRegistered) {
        return res.status(400).json({
          status: 400,
          message: "Name already used",
        });
      }

      const user = await usersModel.findById(id);

      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "User not found",
        });
      }

      user.set("fullName", newFullName);
      user.set("email", newEmail);

      await user.save();

      return res.status(200).json({
        status: 200,
        data: user,
        message: "Edit Profile successfully",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  },
];

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: 400, message: "Please fill all required fields." });
    } else {
      const user = await usersModel.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ status: 400, message: "Email or password is incorrect." });
      } else {
        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
          res
            .status(400)
            .json({ status: 400, message: "Email or password is incorrect." });
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
        .json({ status: 400, message: "User ID is required to logout." });
    }

    const user = await usersModel.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found." });
    }

    // Hapus atau atur token menjadi null
    user.set("token", null);
    await user.save();

    return res
      .status(200)
      .json({ status: 200, message: "User logged out successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: 500, message: "An error occurred while logging out." });
  }
};
