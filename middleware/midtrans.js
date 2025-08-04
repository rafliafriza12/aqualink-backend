import Midtrans from "midtrans-client";
import { configDotenv } from "dotenv";
configDotenv();
const midtransClient = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_ISPRODUCTION,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export default midtransClient;
