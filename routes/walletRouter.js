import express from "express";
import { getWalletByUserId } from "../controllers/walletController.js";

const walletRouter = express.Router();

walletRouter.get("/getWalletByUserId/:userId", getWalletByUserId);

export default walletRouter;
