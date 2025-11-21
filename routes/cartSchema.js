const express = require("express");
const CartProduct = require("../models/cartSchema");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth.middleware");
const route = express.Router();

// ==================== USER ROUTES (Protected) ====================

// Get User's Cart
route.get("/getUserCart", authenticateUser, async (req, res) => {
  try {
    const cart = await CartProduct.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      cart,
      totalItems: cart.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add to Cart
route.post("/addCart", authenticateUser, async (req, res) => {
  try {
    const {
      productId,
      quantity,
      size,
      color,
      price,
      image,
      title,
      shortDiscription
    } = req.body;

    // Validation
    if (!productId || !quantity || !size || !color || !price) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Check if item already exists in cart with same variant
    const existingItem = await CartProduct.findOne({
      userId: req.userId,
      productId,
      size,
      color
    });

    if (existingItem) {
      // Update quantity instead of creating duplicate
      existingItem.quantity += quantity;
      await existingItem.save();

      return res.status(200).json({
        success: true,
        message: "Cart item quantity updated",
        cart: existingItem
      });
    }

    // Create new cart item
    const cartItem = await CartProduct.create({
      userId: req.userId,
      productId,
      quantity,
      size,
      color,
      price,
      image,
      title,
      shortDiscription
    });

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      cart: cartItem
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update Cart Item Quantity
route.put("/updateCart", authenticateUser, async (req, res) => {
  try {
    const { Id } = req.query;
    const { quantity } = req.body;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Cart item ID is required"
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required"
      });
    }

    // Find cart item and verify ownership
    const cartItem = await CartProduct.findOne({
      _id: Id,
      userId: req.userId
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found or unauthorized"
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      success: true,
      message: "Cart item updated",
      cart: cartItem
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete Cart Item
route.delete("/deleteCart", authenticateUser, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Cart item ID is required"
      });
    }

    // Find and delete cart item (only if it belongs to the user)
    const result = await CartProduct.deleteOne({
      _id: Id,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from cart"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear entire cart for user
route.delete("/clearCart", authenticateUser, async (req, res) => {
  try {
    const result = await CartProduct.deleteMany({ userId: req.userId });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get cart item count
route.get("/cartCount", authenticateUser, async (req, res) => {
  try {
    const count = await CartProduct.countDocuments({ userId: req.userId });

    res.status(200).json({
      success: true,
      count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Carts (Admin only)
route.get("/getAllCarts", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const carts = await CartProduct.find({})
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await CartProduct.countDocuments();

    res.status(200).json({
      success: true,
      carts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = route;