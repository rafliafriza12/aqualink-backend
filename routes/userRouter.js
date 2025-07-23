import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  changePassword,
  editProfile,
  loginByGoogle,
  registerByGoogle,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", registerUser);
userRouter.post("/register/google", registerByGoogle);
userRouter.put("/changePassword/:id", changePassword);
userRouter.put("/editProfile/:id", editProfile);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginByGoogle);
userRouter.post("/logout", logoutUser);

export default userRouter;
