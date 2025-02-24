import express from "express";
import { getHistories } from "../controllers/historyUsageController.js";

const historyRouter = express.Router();

historyRouter.get("/getHistory/:userId/:waterCreditId", getHistories);

export default historyRouter;
