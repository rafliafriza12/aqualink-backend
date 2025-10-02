import Meteran from "../models/Meteran.js";
import User from "../models/User.js";
import ConnectionData from "../models/ConnectionData.js";

// Create Meteran (Admin)
export const createMeteran = async (req, res) => {
  try {
    const {
      noMeteran,
      kelompokPelangganId,
      userId,
      connectionDataId,
      totalPemakaian,
      pemakaianBelumTerbayar,
      jatuhTempo,
    } = req.body;

    // Check if connection data is completed
    const connectionData = await ConnectionData.findById(connectionDataId);
    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    if (!connectionData.isAllProcedureDone) {
      return res.status(400).json({
        status: 400,
        message: "All procedures must be completed first",
      });
    }

    // Check if meteran already exists for this user
    const existingMeteran = await Meteran.findOne({ userId });
    if (existingMeteran) {
      return res.status(400).json({
        status: 400,
        message: "Meteran already exists for this user",
      });
    }

    const meteran = new Meteran({
      noMeteran,
      kelompokPelangganId,
      userId,
      totalPemakaian: totalPemakaian || 0,
      pemakaianBelumTerbayar: pemakaianBelumTerbayar || 0,
      jatuhTempo: jatuhTempo || null,
    });

    await meteran.save();

    // Update user with meteran ID, connection data ID, and verify user
    const user = await User.findById(userId);
    user.meteranId = meteran._id;
    user.SambunganDataId = connectionDataId;
    user.isVerified = true;
    await user.save();

    res.status(201).json({
      status: 201,
      message: "Meteran created successfully",
      data: meteran,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get All Meteran (Admin)
export const getAllMeteran = async (req, res) => {
  try {
    const meteran = await Meteran.find()
      .populate("kelompokPelangganId")
      .populate("userId", "email fullName phone");

    res.status(200).json({
      status: 200,
      data: meteran,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Meteran by ID
export const getMeteranById = async (req, res) => {
  try {
    const { id } = req.params;

    const meteran = await Meteran.findById(id)
      .populate("kelompokPelangganId")
      .populate("userId", "email fullName phone");

    if (!meteran) {
      return res.status(404).json({
        status: 404,
        message: "Meteran not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: meteran,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Meteran by User ID
export const getMeteranByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const meteran = await Meteran.findOne({ userId })
      .populate("kelompokPelangganId")
      .populate("userId", "email fullName phone");

    if (!meteran) {
      return res.status(404).json({
        status: 404,
        message: "Meteran not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: meteran,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Update Meteran (Admin)
export const updateMeteran = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const meteran = await Meteran.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!meteran) {
      return res.status(404).json({
        status: 404,
        message: "Meteran not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Meteran updated successfully",
      data: meteran,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Delete Meteran (Admin)
export const deleteMeteran = async (req, res) => {
  try {
    const { id } = req.params;

    const meteran = await Meteran.findByIdAndDelete(id);

    if (!meteran) {
      return res.status(404).json({
        status: 404,
        message: "Meteran not found",
      });
    }

    // Update user
    await User.findByIdAndUpdate(meteran.userId, {
      meteranId: null,
    });

    res.status(200).json({
      status: 200,
      message: "Meteran deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
