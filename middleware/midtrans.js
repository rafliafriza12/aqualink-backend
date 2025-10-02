import Midtrans from "midtrans-client";
import { configDotenv } from "dotenv";
configDotenv();
// const midtransClient = new Midtrans.Snap({
//   isProduction: process.env.MIDTRANS_ISPRODUCTION,
//   serverKey: process.env.MIDTRANS_SERVER_KEY,
//   clientKey: process.env.MIDTRANS_CLIENT_KEY,
// });

const midtransClient = new Midtrans.Snap({
  isProduction: false,
  serverKey: "SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-",
  clientKey: "SB-Mid-client-63GqcLJxWhrc5D0A",
});

export default midtransClient;
