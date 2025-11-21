const express = require("express");
const Product = require("../models/productSchema");
const { authenticateAdmin, optionalAuth } = require("../middleware/auth.middleware");
const route = express.Router();
const upload = require("../utils/upload.js");
const deleteFromCloudinary = require('../utils/delete_images.js');

// ==================== PUBLIC ROUTES ====================

// Get Product by ID
route.get("/getProductById", async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const product = await Product.findById(Id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Products by Category
route.get("/getProductByCategory", async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    let query = {};
    if (category !== "all") {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProducts: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get All Products with Pagination and Filters
route.get("/getAllProducts", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subCategory,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (subCategory) {
      query.subCategory = subCategory;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProducts: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get All Categories
route.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.status(200).json({
      success: true,
      categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Subcategories by Category
route.get("/subcategories", async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    const subCategories = await Product.distinct('subCategory', { category });
    
    res.status(200).json({
      success: true,
      subCategories: subCategories.filter(sc => sc) // Remove null/undefined
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Add New Product (Admin only)
route.post("/addProduct", authenticateAdmin, upload.array("assets", 10), async (req, res) => {
  try {
    const { title, category, subCategory, colors, price, description, sizes } = req.body;

    // Validation
    if (!title || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and price are required"
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => {
        const type = file.mimetype.split("/")[0];
        return {
          type,
          url: file.path,
        };
      });
    }

    const parsedColors = colors ? JSON.parse(colors) : [];
    const parsedSizes = sizes ? JSON.parse(sizes) : [];

    const newProduct = new Product({
      title,
      category,
      subCategory: subCategory || undefined,
      colors: parsedColors,
      price: parseFloat(price),
      description: description || undefined,
      sizes: parsedSizes,
      assets: images,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct
    });

  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating product"
    });
  }
});

// Update Product (Admin only)
route.put("/updateProduct", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const {
      title,
      category,
      subCategory,
      colors,
      sizes,
      price,
      description
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (colors !== undefined) updateData.colors = colors;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update Product Images (Admin only)
route.put("/updateProductImages", authenticateAdmin, upload.array("assets", 10), async (req, res) => {
  try {
    const { id } = req.query;
    const { removeImages } = req.body; // Array of image URLs to remove

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Remove specified images
    if (removeImages) {
      const imagesToRemove = JSON.parse(removeImages);
      for (const imageUrl of imagesToRemove) {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await deleteFromCloudinary(publicId);
        product.assets = product.assets.filter(asset => asset.url !== imageUrl);
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => {
        const type = file.mimetype.split("/")[0];
        return {
          type,
          url: file.path,
        };
      });
      product.assets.push(...newImages);
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product images updated successfully",
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete Product (Admin only)
route.delete("/deleteProduct", authenticateAdmin, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const product = await Product.findById(Id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete all associated images from Cloudinary
    if (product.assets && product.assets.length > 0) {
      const deletionPromises = product.assets.map(asset => {
        const publicId = asset.url.split('/').pop().split('.')[0];
        return deleteFromCloudinary(publicId);
      });
      await Promise.all(deletionPromises);
    }

    await Product.deleteOne({ _id: Id });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Product Statistics (Admin)
route.get("/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const categories = await Product.distinct('category');
    
    // Get products by category
    const productsByCategory = await Promise.all(
      categories.map(async (category) => ({
        category,
        count: await Product.countDocuments({ category })
      }))
    );

    // Get price statistics
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalCategories: categories.length,
        productsByCategory,
        priceStats: priceStats[0] || {}
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