import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  changePassword,
  editProfile,
  login,
  logout,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/", registerUser);
userRouter.put("/changePassword/:id", changePassword);
userRouter.put("/editProfile/:id", editProfile);
userRouter.post("/login", login);
userRouter.post("/logout", verifyToken, logout);

export default userRouter;
