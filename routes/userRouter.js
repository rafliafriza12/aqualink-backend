import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  changePassword,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", registerUser);
userRouter.put("/changePassword/:id", changePassword);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);

export default userRouter;
