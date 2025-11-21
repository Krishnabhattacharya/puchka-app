const express = require("express");
const User = require("../models/userSchema");
const { generateTokenPair, verifyRefreshToken, invalidateRefreshToken, invalidateAllUserTokens } = require("../utils/jwt.utils");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth.middleware");
const route = express.Router();

// ==================== PUBLIC ROUTES ====================

// User Registration
route.post("/register", async (req, res) => {
  try {
    const { mobileNumber, name, password, city, pincode, address, nearByLocation } = req.body;

    // Validation
    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this mobile number already exists"
      });
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = Math.random().toString(16).slice(2, 8).toUpperCase();
      const existing = await User.findOne({ referralCode });
      if (!existing) isUnique = true;
    }

    // Create new user
    const newUser = new User({
      name: name || "",
      mobileNumber,
      password,
      city: city || "",
      pincode: pincode || 0,
      address: address || "",
      nearByLocation: nearByLocation || "",
      referralCode
    });

    await newUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair(newUser._id, 'user', req);

    // Update last login
    await newUser.updateLastLogin();

    // Remove password from response
    const userResponse = newUser.toJSON();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during registration"
    });
  }
});

// User Login
route.post("/login", async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Validation
    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required"
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ mobileNumber }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid mobile number or password"
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Account is temporarily locked due to multiple failed login attempts. Please try again later."
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password"
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokenPair(user._id, 'user', req);

    // Update last login
    await user.updateLastLogin();

    // Remove sensitive fields from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});

// Refresh Token
route.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive"
      });
    }

    // Invalidate old refresh token
    await invalidateRefreshToken(refreshToken);

    // Generate new token pair
    const tokens = await generateTokenPair(user._id, 'user', req);

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

// Logout (Invalidate current refresh token)
route.post("/logout", authenticateUser, async (req, res) => {
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
route.post("/logout-all", authenticateUser, async (req, res) => {
  try {
    await invalidateAllUserTokens(req.userId);

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

// Get Current User Profile
route.get("/profile", authenticateUser, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update User Profile
route.put("/profile", authenticateUser, async (req, res) => {
  try {
    const { name, address, nearByLocation, city, pincode } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (nearByLocation !== undefined) updateData.nearByLocation = nearByLocation;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Change Password
route.put("/change-password", authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all existing tokens (force re-login)
    await invalidateAllUserTokens(user._id);

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

// Get User by ID (Public but sanitized)
route.get("/getUserById", async (req, res) => {
  try {
    const Id = req.query.Id;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const result = await User.findById(Id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      user: result,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get User by Referral Code
route.get("/getUserByReferral", async (req, res) => {
  try {
    const referralCode = req.query.code;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required"
      });
    }

    const result = await User.findOne({ referralCode: referralCode.toUpperCase() });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found with this referral code"
      });
    }

    res.status(200).json({
      user: result,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN ONLY ROUTES ====================

// Get All Users (Admin only)
route.get("/getAllUsers", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update User by Admin
route.put("/updateUser", authenticateAdmin, async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const {
      name,
      mobileNumber,
      address,
      nearByLocation,
      city,
      pincode,
      walletAmount,
      isActive
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
    if (address !== undefined) updateData.address = address;
    if (nearByLocation !== undefined) updateData.nearByLocation = nearByLocation;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (walletAmount !== undefined) updateData.walletAmount = walletAmount;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete User (Admin only)
route.delete("/deleteUser", authenticateAdmin, async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Invalidate all user tokens
    await invalidateAllUserTokens(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = route;