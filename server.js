import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import { configDotenv } from "dotenv";
// import fileUpload from 'express-fileupload';
import userRouter from "./routes/userRouter.js";
import reportRouter from "./routes/reportRouter.js";
import transactionRouter from "./routes/transactionRoutes.js";
import paymentRouter from "./routes/paymentRouter.js";
import waterCreditRouter from "./routes/waterCreditRoutes.js";
import subscribeRouter from "./routes/subscribeRouter.js";
import walletRouter from "./routes/walletRouter.js";
import notificationRouter from "./routes/notificationRoutes.js";
import historyRouter from "./routes/historyRoutes.js";
import adminAccountRouter from "./routes/adminAccountRoutes.js";
import connectionDataRouter from "./routes/connectionDataRoutes.js";
import surveyDataRouter from "./routes/surveyDataRoutes.js";
import rabConnectionRouter from "./routes/rabConnectionRoutes.js";
import meteranRouter from "./routes/meteranRoutes.js";
import kelompokPelangganRouter from "./routes/kelompokPelangganRoutes.js";
import technicianRouter from "./routes/technicianRoutes.js";
import billingRouter from "./routes/billingRoutes.js";
import monitoringRouter from "./routes/monitoringRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import documentRouter from "./routes/documentRoutes.js";
import {
  setupBillingCron,
  setupOverdueCron,
  setupReminderCron,
} from "./utils/billingCron.js";

const app = express();
const port = 5000;

configDotenv();
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, clientOptions);
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Koneksi ke MongoDB gagal:", error);
    process.exit(1); // Keluar dari proses jika koneksi gagal
  }
}

app.get("/", (req, res) => {
  res.send("hallo");
});

// Webhook routes (HARUS di atas semua route lain, tanpa middleware auth)
app.use("/webhook", webhookRouter);

app.use("/users", userRouter);
app.use("/report", reportRouter);
app.use("/transactions", transactionRouter);
app.use("/midtrans", paymentRouter);
app.use("/waterCredit", waterCreditRouter);
app.use("/subscribe", subscribeRouter);
app.use("/wallet", walletRouter);
app.use("/notification", notificationRouter);
app.use("/history", historyRouter);
app.use("/billing", billingRouter);
app.use("/admin/auth", adminAccountRouter);
app.use("/connection-data", connectionDataRouter);
app.use("/survey-data", surveyDataRouter);
app.use("/rab-connection", rabConnectionRouter);
app.use("/meteran", meteranRouter);
app.use("/kelompok-pelanggan", kelompokPelangganRouter);
app.use("/technician", technicianRouter);
app.use("/monitoring", monitoringRouter);
app.use("/documents", documentRouter);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);

      // Setup cron jobs after server starts
      console.log("\n🚀 Setting up billing cron jobs...");
      setupBillingCron(); // Auto-generate billing monthly
      setupOverdueCron(); // Check overdue daily
      setupReminderCron(); // Send reminders daily
      console.log("✅ All cron jobs are active\n");
    });
  })
  .catch(console.dir);
