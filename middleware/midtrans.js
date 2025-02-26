import Midtrans from "midtrans-client";

const midtransClient = new Midtrans.Snap({
  isProduction: process.env.IS_PRODUCTION === "true", // Ubah ke true jika di production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export default midtransClient;
