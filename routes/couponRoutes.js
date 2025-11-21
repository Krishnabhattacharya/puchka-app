const express = require("express");
const Coupon = require("../models/couponSchema");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth.middleware");
const route = express.Router();

// ==================== USER ROUTES ====================

// Validate and Get Coupon Details (Public/User)
route.post("/validate", authenticateUser, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required"
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim()
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code"
      });
    }

    res.status(200).json({
      success: true,
      message: "Valid coupon",
      coupon: {
        code: coupon.code,
        discount: coupon.discount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get All Active Coupons (User - only code and discount)
route.get("/active", async (req, res) => {
  try {
    const coupons = await Coupon.find({})
      .select('code discount')
      .sort({ discount: -1 });

    res.status(200).json({
      success: true,
      coupons
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Coupons (Admin)
route.get("/getAllCoupons", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.code = { $regex: search, $options: 'i' };
    }

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      coupons,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCoupons: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Coupon by ID (Admin)
route.get("/getCouponById", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required"
      });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.status(200).json({
      success: true,
      coupon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create New Coupon (Admin only)
route.post("/createCoupon", authenticateAdmin, async (req, res) => {
  try {
    const { code, discount } = req.body;

    // Validation
    if (!code || discount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and discount are required"
      });
    }

    if (discount < 0 || discount > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 100"
      });
    }

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase().trim()
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon with this code already exists"
      });
    }

    // Create new coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discount: parseFloat(discount)
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update Coupon (Admin only)
route.put("/updateCoupon", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;
    const { code, discount } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required"
      });
    }

    // Validation
    if (discount !== undefined && (discount < 0 || discount > 100)) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 100"
      });
    }

    const updateData = {};
    if (code !== undefined) {
      // Check if new code already exists
      const existing = await Coupon.findOne({
        code: code.toUpperCase().trim(),
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Coupon with this code already exists"
        });
      }

      updateData.code = code.toUpperCase().trim();
    }
    if (discount !== undefined) updateData.discount = parseFloat(discount);

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete Coupon (Admin only)
route.delete("/deleteCoupon", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required"
      });
    }

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Coupon Statistics (Admin)
route.get("/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    
    const discountStats = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          avgDiscount: { $avg: '$discount' },
          minDiscount: { $min: '$discount' },
          maxDiscount: { $max: '$discount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCoupons,
        discountStats: discountStats[0] || {}
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = route;