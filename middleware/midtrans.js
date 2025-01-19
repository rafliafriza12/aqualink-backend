import Midtrans from "midtrans-client";

const snap = new Midtrans.Snap({
  isProduction: false, // Ubah ke true jika di production
  serverKey: "SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-",
  clientKey: "SB-Mid-client-63GqcLJxWhrc5D0A",
});

export default snap;
