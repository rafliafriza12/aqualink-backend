import Technician from "../models/Technician.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Create Technician (Admin)
export const createTechnician = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check if technician already exists
    const existingTechnician = await Technician.findOne({ email });
    if (existingTechnician) {
      return res.status(400).json({
        status: 400,
        message: "Technician already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const technician = new Technician({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    await technician.save();

    res.status(201).json({
      status: 201,
      message: "Technician created successfully",
      data: {
        id: technician._id,
        fullName: technician.fullName,
        email: technician.email,
        phone: technician.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Login Technician
export const loginTechnician = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find technician
    const technician = await Technician.findOne({ email });
    if (!technician) {
      return res.status(404).json({
        status: 404,
        message: "Technician not found",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, technician.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 401,
        message: "Invalid password",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: technician._id, email: technician.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    technician.token = token;
    await technician.save();

    res.status(200).json({
      status: 200,
      message: "Login successful",
      data: {
        id: technician._id,
        fullName: technician.fullName,
        email: technician.email,
        phone: technician.phone,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get All Technicians (Admin)
export const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().select("-password -token");

    res.status(200).json({
      status: 200,
      data: technicians,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Technician by ID
export const getTechnicianById = async (req, res) => {
  try {
    const { id } = req.params;

    const technician = await Technician.findById(id).select("-password -token");

    if (!technician) {
      return res.status(404).json({
        status: 404,
        message: "Technician not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: technician,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Get Technician Profile
export const getTechnicianProfile = async (req, res) => {
  try {
    const technicianId = req.technician.id;

    const technician = await Technician.findById(technicianId).select(
      "-password -token"
    );

    if (!technician) {
      return res.status(404).json({
        status: 404,
        message: "Technician not found",
      });
    }

    res.status(200).json({
      status: 200,
      data: technician,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Update Technician (Admin)
export const updateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const technician = await Technician.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password -token");

    if (!technician) {
      return res.status(404).json({
        status: 404,
        message: "Technician not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Technician updated successfully",
      data: technician,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Delete Technician (Admin)
export const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;

    const technician = await Technician.findByIdAndDelete(id);

    if (!technician) {
      return res.status(404).json({
        status: 404,
        message: "Technician not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Technician deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// Logout Technician
export const logoutTechnician = async (req, res) => {
  try {
    const technicianId = req.technician.id;

    await Technician.findByIdAndUpdate(technicianId, { token: null });

    res.status(200).json({
      status: 200,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
