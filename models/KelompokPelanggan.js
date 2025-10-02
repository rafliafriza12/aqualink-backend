import mongoose from "mongoose";

const KelompokPelanggan = new mongoose.Schema(
  {
    namaKelompok: {
      type: String,
      required: true,
    },
    hargaPenggunaanDibawah10: {
      type: Number,
      required: true,
    },
    hargaPenggunaanDiatas10: {
      type: Number,
      required: true,
    },
    biayaBeban: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("KelompokPelanggan", KelompokPelanggan);
