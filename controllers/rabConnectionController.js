import RabConnection from "../models/RabConnection.js";
import ConnectionData from "../models/ConnectionData.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import midtransClient from "midtrans-client";

// Create RAB Connection (Technician)
export const createRabConnection = async (req, res) => {
  try {
    const { connectionDataId, totalBiaya } = req.body;

    // Check if connection data exists and verified
    const connectionData = await ConnectionData.findById(connectionDataId);
    if (!connectionData) {
      return res.status(404).json({
        status: 404,
        message: "Connection data not found",
      });
    }

    if (!connectionData.isVerifiedByTechnician) {
      return res.status(400).json({
        status: 400,
        message: "Connection data must be verified by technician first",
      });
    }

    // Check if RAB already exists
    const existingRab = await RabConnection.findOne({ connectionDataId });
    if (existingRab) {
      return res.status(400).json({
        status: 400,
        message: "RAB connection already exists for this connection",
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: "RAB PDF file is required",
      });
    }

    // Upload RAB document to Cloudinary
    const rabUrl = await uploadToCloudinary(req.file.buffer, "aqualink/rab");

    const rabConnection = new RabConnection({
      connectionDataId,
      userId: connectionData.userId,
      totalBiaya: parseInt(totalBiaya),
      rabUrl,
    });

    await rabConnection.save();

    // Update connection data with RAB ID
    connectionData.rabConnectionId = rabConnection._id;
    await connectionData.save();

    res.status(201).json({
      status: 201,
      message: "RAB connection created successfully",
      data: rabConnection,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get All RAB Connections (Admin/Technician)
export const getAllRabConnections = async (req, res) => {
  try {
    const { isPaid } = req.query;

    let filter = {};
    if (isPaid !== undefined) filter.isPaid = isPaid === "true";

    const rabConnections = await RabConnection.find(filter)
      .populate("connectionDataId")
      .populate("userId", "email fullName phone");

    res.status(200).json({
      status: 200,
      data: rabConnections,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get RAB Connection by ID
export const getRabConnectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const rabConnection = await RabConnection.findById(id)
      .populate("connectionDataId")
      .populate("userId", "email fullName phone");

    if (!rabConnection) {
      return res.status(404).json({
        status: 404,
        message: "RAB connection not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: rabConnection,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get RAB Connection by User ID
export const getRabConnectionByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const rabConnection = await RabConnection.findOne({ userId })
      .populate("connectionDataId")
      .populate("userId", "email fullName phone");

    if (!rabConnection) {
      return res.status(404).json({
        status: 404,
        message: "RAB connection not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: rabConnection,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get RAB Connection by Connection Data ID
export const getRabConnectionByConnectionId = async (req, res) => {
  try {
    const { connectionDataId } = req.params;

    const rabConnection = await RabConnection.findOne({ connectionDataId })
      .populate("connectionDataId")
      .populate("userId", "email fullName phone");

    if (!rabConnection) {
      return res.status(404).json({
        status: 404,
        message: "RAB connection not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: rabConnection,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Update RAB Connection Payment Status (User/Admin)
export const updateRabPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    const rabConnection = await RabConnection.findById(id);

    if (!rabConnection) {
      return res.status(404).json({
        status: 404,
        message: "RAB connection not found",
      });
    }

    rabConnection.isPaid = isPaid;
    await rabConnection.save();

    res.status(200).json({
      status: 200,
      message: "RAB payment status updated successfully",
      data: rabConnection,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Update RAB Connection (Technician)
export const updateRabConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle RAB document upload if provided
    if (req.file) {
      updates.rabUrl = await uploadToCloudinary(
        req.file.buffer,
        "aqualink/rab"
      );
    }

    // Convert totalBiaya to number if provided
    if (updates.totalBiaya) {
      updates.totalBiaya = parseInt(updates.totalBiaya);
    }

    const rabConnection = await RabConnection.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!rabConnection) {
      return res.status(404).json({
        status: 404,
        message: "RAB connection not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "RAB connection updated successfully",
      data: rabConnection,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Delete RAB Connection
export const deleteRabConnection = async (req, res) => {
  try {
    const { id } = req.params;

    const rabConnection = await RabConnection.findByIdAndDelete(id);

    if (!rabConnection) {
      return res.status(404).json({
        status: 404,
        message: "RAB connection not found",
      });
    }

    // Remove RAB ID from connection data
    await ConnectionData.findByIdAndUpdate(rabConnection.connectionDataId, {
      rabConnectionId: null,
    });

    res.status(200).json({
      status: 200,
      message: "RAB connection deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Create Payment Transaction for RAB (User)
export const createRabPayment = async (req, res) => {
  try {
    const { rabId } = req.params;
    const userId = req.user.id;

    // Get RAB data
    const rab = await RabConnection.findById(rabId)
      .populate("userId", "fullName email phone")
      .populate("connectionDataId");

    if (!rab) {
      return res.status(404).json({
        status: 404,
        message: "RAB not found",
      });
    }

    // Verify user ownership
    if (rab.userId._id.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: "Unauthorized to pay this RAB",
      });
    }

    // Check if already paid
    if (rab.isPaid) {
      return res.status(400).json({
        status: 400,
        message: "RAB already paid",
      });
    }

    // Create order_id dengan format RAB-{rabId}
    const orderId = `RAB-${rab._id}`;

    // Initialize Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    // Midtrans parameter
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: rab.totalBiaya,
      },
      customer_details: {
        first_name: rab.userId.fullName,
        email: rab.userId.email,
        phone: rab.userId.phone || "08123456789",
      },
      item_details: [
        {
          id: `rab-${rab._id}`,
          price: rab.totalBiaya,
          quantity: 1,
          name: `Biaya Pemasangan RAB`,
        },
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/rab/success`,
        error: `${process.env.FRONTEND_URL}/rab/error`,
        pending: `${process.env.FRONTEND_URL}/rab/pending`,
      },
    };

    // Create transaction
    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({
      status: 200,
      message: "Payment transaction created successfully",
      data: {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId: orderId,
        grossAmount: rab.totalBiaya,
      },
    });
  } catch (error) {
    console.error("Error creating RAB payment:", error);
    res.status(500).json({
      status: 500,
      message: error.message || "Failed to create payment transaction",
    });
  }
};
