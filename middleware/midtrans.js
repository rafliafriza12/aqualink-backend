import Midtrans from "midtrans-client";

const midtransClient = new Midtrans.Snap({
  isProduction: true, // Ubah ke true jika di production
  serverKey: "Mid-server-Whs2-Z-Jp1V3ZURCnJRvAfn8",
  clientKey: "Mid-client-PNhSygI_tx1xDs_b",
});
// const midtransClient = new Midtrans.CoreApi({
//   isProduction: false, // Ubah ke true jika di production
//   serverKey: "SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-",
//   clientKey: "SB-Mid-client-63GqcLJxWhrc5D0A",
// });

export default midtransClient;
