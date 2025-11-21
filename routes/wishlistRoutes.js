const express = require("express");
const Wishlist = require("../models/wishlistSchema");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth.middleware");
const route = express.Router();

// ==================== USER ROUTES (Protected) ====================

// Get User's Wishlist
route.get("/getUserWishlist", authenticateUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      wishlist,
      totalItems: wishlist.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add to Wishlist
route.post("/addToWishlist", authenticateUser, async (req, res) => {
  try {
    const { productId, price, image, title, shortDiscription } = req.body;

    // Validation
    if (!productId || !price) {
      return res.status(400).json({
        success: false,
        message: "Product ID and price are required"
      });
    }

    // Check if item already exists in wishlist
    const existingItem = await Wishlist.findOne({
      userId: req.userId,
      productId
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist"
      });
    }

    // Create new wishlist item
    const wishlistItem = await Wishlist.create({
      userId: req.userId,
      productId,
      price,
      image,
      title,
      shortDiscription
    });

    res.status(201).json({
      success: true,
      message: "Item added to wishlist",
      wishlist: wishlistItem
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Remove from Wishlist
route.delete("/removeFromWishlist", authenticateUser, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Wishlist item ID is required"
      });
    }

    // Find and delete wishlist item (only if it belongs to the user)
    const result = await Wishlist.deleteOne({
      _id: Id,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from wishlist"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Remove from Wishlist by Product ID
route.delete("/removeByProductId", authenticateUser, async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const result = await Wishlist.deleteOne({
      userId: req.userId,
      productId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item removed from wishlist"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Clear entire wishlist for user
route.delete("/clearWishlist", authenticateUser, async (req, res) => {
  try {
    const result = await Wishlist.deleteMany({ userId: req.userId });

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check if product is in wishlist
route.get("/isInWishlist", authenticateUser, async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const item = await Wishlist.findOne({
      userId: req.userId,
      productId
    });

    res.status(200).json({
      success: true,
      isInWishlist: !!item,
      wishlistItem: item
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get wishlist item count
route.get("/wishlistCount", authenticateUser, async (req, res) => {
  try {
    const count = await Wishlist.countDocuments({ userId: req.userId });

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

// Get All Wishlists (Admin only)
route.get("/getAllWishlists", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const wishlists = await Wishlist.find({})
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Wishlist.countDocuments();

    res.status(200).json({
      success: true,
      wishlists,
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

// Get most wishlisted products (Admin)
route.get("/admin/popularWishlist", authenticateAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularProducts = await Wishlist.aggregate([
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 },
          title: { $first: '$title' },
          image: { $first: '$image' },
          price: { $first: '$price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      popularProducts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = route;