import ConnectionData from "../models/ConnectionData.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Create Connection Data (User)
export const createConnectionData = async (req, res) => {
  try {
    const { nik, noKK, alamat, kecamatan, kelurahan, noImb, luasBangunan } =
      req.body;

    const userId = req.user.id;

    // Check if user already has connection data
    const existingConnection = await ConnectionData.findOne({ userId });
    if (existingConnection) {
      return res.status(400).json({
        status: 400,
        message: "User already has connection data",
      });
    }

    // Check if files are uploaded
    if (
      !req.files ||
      !req.files.nikFile ||
      !req.files.kkFile ||
      !req.files.imbFile
    ) {
      return res.status(400).json({
        status: 400,
        message: "All PDF files (NIK, KK, IMB) are required",
      });
    }

    // Upload PDF files to Cloudinary
    const nikUrl = await uploadToCloudinary(
      req.files.nikFile[0].buffer,
      "aqualink/nik"
    );
    const kkUrl = await uploadToCloudinary(
      req.files.kkFile[0].buffer,
      "aqualink/kk"
    );
    const imbUrl = await uploadToCloudinary(
      req.files.imbFile[0].buffer,
      "aqualink/imb"
    );

    const connectionData = new ConnectionData({
      userId,
      nik,
      nikUrl,
      noKK,
      kkUrl,
      alamat,
      kecamatan,
      kelurahan,
      noImb,
      imbUrl,
      luasBangunan: parseInt(luasBangunan),
    });

    await connectionData.save();

    res.status(201).json({
      status: 201,
      message: "Connection data created successfully",
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Connection Data by User ID
export const getConnectionDataByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const connectionData = await ConnectionData.findOne({ userId })
      .populate("userId", "email fullName phone")
      .populate("surveiId")
      .populate("rabConnectionId");

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get All Connection Data (Admin)
export const getAllConnectionData = async (req, res) => {
  try {
    const { isVerifiedByData, isVerifiedByTechnician, isAllProcedureDone } =
      req.query;

    let filter = {};
    if (isVerifiedByData !== undefined)
      filter.isVerifiedByData = isVerifiedByData === "true";
    if (isVerifiedByTechnician !== undefined)
      filter.isVerifiedByTechnician = isVerifiedByTechnician === "true";
    if (isAllProcedureDone !== undefined)
      filter.isAllProcedureDone = isAllProcedureDone === "true";

    const connectionData = await ConnectionData.find(filter)
      .populate("userId", "email fullName phone")
      .populate("surveiId")
      .populate("rabConnectionId");

    res.status(200).json({
      status: 200,
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Connection Data by ID (Admin/Technician)
export const getConnectionDataById = async (req, res) => {
  try {
    const { id } = req.params;

    const connectionData = await ConnectionData.findById(id)
      .populate("userId", "email fullName phone")
      .populate("surveiId")
      .populate("rabConnectionId");

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Verify Connection Data by Admin
export const verifyConnectionDataByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const connectionData = await ConnectionData.findById(id);

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    connectionData.isVerifiedByData = true;
    await connectionData.save();

    res.status(200).json({
      status: 200,
      message: "Connection data verified by admin successfully",
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Verify Connection Data by Technician
export const verifyConnectionDataByTechnician = async (req, res) => {
  try {
    const { id } = req.params;

    const connectionData = await ConnectionData.findById(id);

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    if (!connectionData.isVerifiedByData) {
      return res.status(400).json({
        status: 400,
        message: "Connection data must be verified by admin first",
      });
    }

    connectionData.isVerifiedByTechnician = true;
    await connectionData.save();

    res.status(200).json({
      status: 200,
      message: "Connection data verified by technician successfully",
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Complete All Procedure (Admin)
export const completeAllProcedure = async (req, res) => {
  try {
    const { id } = req.params;

    const connectionData = await ConnectionData.findById(id);

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    // Check if RAB is paid
    if (connectionData.rabConnectionId) {
      const RabConnection = (await import("../models/RabConnection.js"))
        .default;
      const rab = await RabConnection.findById(connectionData.rabConnectionId);

      if (!rab || !rab.isPaid) {
        return res.status(400).json({
          status: 400,
          message: "RAB must be paid first",
        });
      }
    } else {
      return res.status(400).json({
        status: 400,
        message: "RAB connection not created yet",
      });
    }

    connectionData.isAllProcedureDone = true;
    await connectionData.save();

    res.status(200).json({
      status: 200,
      message: "All procedure completed successfully",
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Update Connection Data
export const updateConnectionData = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle PDF file uploads if provided
    if (req.files) {
      if (req.files.nikFile) {
        updates.nikUrl = await uploadToCloudinary(
          req.files.nikFile[0].buffer,
          "aqualink/nik"
        );
      }
      if (req.files.kkFile) {
        updates.kkUrl = await uploadToCloudinary(
          req.files.kkFile[0].buffer,
          "aqualink/kk"
        );
      }
      if (req.files.imbFile) {
        updates.imbUrl = await uploadToCloudinary(
          req.files.imbFile[0].buffer,
          "aqualink/imb"
        );
      }
    }

    // Convert luasBangunan to number if provided
    if (updates.luasBangunan) {
      updates.luasBangunan = parseInt(updates.luasBangunan);
    }

    const connectionData = await ConnectionData.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Connection data updated successfully",
      data: connectionData,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Delete Connection Data
export const deleteConnectionData = async (req, res) => {
  try {
    const { id } = req.params;

    const connectionData = await ConnectionData.findByIdAndDelete(id);

    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Connection data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
