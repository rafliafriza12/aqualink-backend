import express from "express";
import {
  createSubscribe,
  incrementUsedWater,
  isBalanceZero,
} from "../controllers/subscribeController.js";

const subscribeRouter = express.Router();

subscribeRouter.post("/subscribeWaterCredit", createSubscribe);
subscribeRouter.put("/usedWater/:userId/:waterCreditId", incrementUsedWater);
subscribeRouter.get("/closePipe/:userId/:waterCreditId", isBalanceZero);

export default subscribeRouter;
