const express = require("express");
const Admin = require("../models/admin.model");
const { 
  generateTokenPair, 
  verifyRefreshToken, 
  invalidateRefreshToken, 
  invalidateAllUserTokens 
} = require("../utils/jwt.utils");

const { authenticateAdmin } = require("../middleware/auth.middleware");
const route = express.Router();

// ==================== PUBLIC ROUTES ====================

// Admin Login
route.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const admin = await Admin.findOne({ username }).select("+password");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (admin.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Account is temporarily locked due to multiple failed login attempts."
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated."
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    const { accessToken, refreshToken } = await generateTokenPair(admin._id, "admin", req);
    await admin.updateLastLogin();

    const adminResponse = admin.toJSON();

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      admin: adminResponse,
      tokens: { accessToken, refreshToken }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});

// Refresh token
route.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    const decoded = await verifyRefreshToken(refreshToken);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Invalid token type"
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin not found or inactive"
      });
    }

    await invalidateRefreshToken(refreshToken);

    const tokens = await generateTokenPair(admin._id, "admin", req);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      tokens
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || "Invalid refresh token"
    });
  }
});


// ==================== PROTECTED ROUTES ====================

// Logout
route.post("/logout", authenticateAdmin, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await invalidateRefreshToken(refreshToken);
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
});

// Logout from all devices
route.post("/logout-all", authenticateAdmin, async (req, res) => {
  try {
    await invalidateAllUserTokens(req.adminId);

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
});

// Current admin profile
route.get("/profile", authenticateAdmin, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Change password
route.put("/change-password", authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    const admin = await Admin.findById(req.adminId).select("+password");

    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    admin.password = newPassword;
    await admin.save();

    await invalidateAllUserTokens(admin._id);

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again."
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ==================== ADMIN MANAGEMENT (NO SUPER ADMIN REQUIRED) ====================

// Create new admin
route.post("/create-admin", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this username already exists"
      });
    }

    const newAdmin = new Admin({
      username,
      password,
      email: email || undefined,
      role: "admin"
    });

    await newAdmin.save();

    const adminResponse = newAdmin.toJSON();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: adminResponse
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating admin"
    });
  }
});

// Get all admins
route.get("/all-admins", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const admins = await Admin.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Admin.countDocuments(query);

    res.status(200).json({
      success: true,
      admins,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalAdmins: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update admin
route.put("/update-admin/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, isActive } = req.body;

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (isActive === false) {
      await invalidateAllUserTokens(id);
    }

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete admin
route.delete("/delete-admin/:id", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.adminId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    await invalidateAllUserTokens(id);

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = route;
