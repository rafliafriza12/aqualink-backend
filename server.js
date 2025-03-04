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
const app = express();
const port = 5001;

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
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Koneksi ke MongoDB gagal:", error);
        process.exit(1); // Keluar dari proses jika koneksi gagal
    }
}

app.get("/", (req, res) => {
    res.send("hallo");
});

app.use("/users", userRouter);
app.use("/report", reportRouter);
app.use("/transactions", transactionRouter);
app.use("/midtrans", paymentRouter);
app.use("/waterCredit", waterCreditRouter);
app.use("/subscribe", subscribeRouter);
app.use("/wallet", walletRouter);
app.use("/notification", notificationRouter);
app.use("/history", historyRouter);
app.use("/admin/auth", adminAccountRouter);
connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch(console.dir);
