const express = require("express");
const Order = require("../models/orderSchema");
const { authenticateUser, authenticateAdmin } = require("../middleware/auth.middleware");
const route = express.Router();

// ==================== USER ROUTES (Protected) ====================

// Get User's Orders
route.get("/getUserOrders", authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId: req.userId };
    
    // Filter by status if provided
    if (status) {
      if (status === 'pending') {
        query.isPaymentDone = false;
      } else if (status === 'delivered') {
        query.isDelivered = true;
      } else if (status === 'processing') {
        query.isPaymentDone = true;
        query.isDelivered = false;
      }
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalOrders: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Single Order by ID (User can only access their own orders)
route.get("/getOrderById", authenticateUser, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await Order.findOne({
      _id: Id,
      userId: req.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create New Order
route.post("/addOrder", authenticateUser, async (req, res) => {
  try {
    const {
      productId,
      quantity,
      size,
      color,
      price,
      image,
      title,
      shortDiscription,
      deliveryMethod,
      isPaymentDone
    } = req.body;

    // Validation
    if (!productId || !quantity || !size || !color || !price || !deliveryMethod) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    if (!['pickup', 'delivery'].includes(deliveryMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery method. Must be 'pickup' or 'delivery'"
      });
    }

    const order = await Order.create({
      userId: req.userId,
      productId,
      quantity,
      size,
      color,
      price,
      image,
      title,
      shortDiscription,
      deliveryMethod,
      isPaymentDone: isPaymentDone || false,
      isPacked: false,
      isCallDone: false,
      isDelivered: false
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Cancel Order (User can only cancel pending orders)
route.delete("/cancelOrder", authenticateUser, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: Id,
      userId: req.userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or unauthorized"
      });
    }

    // Check if order can be cancelled
    if (order.isPacked || order.isDelivered) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled as it's already packed or delivered"
      });
    }

    await Order.deleteOne({ _id: Id });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Order Statistics for User
route.get("/orderStats", authenticateUser, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ userId: req.userId });
    const deliveredOrders = await Order.countDocuments({
      userId: req.userId,
      isDelivered: true
    });
    const pendingOrders = await Order.countDocuments({
      userId: req.userId,
      isDelivered: false
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalOrders,
        delivered: deliveredOrders,
        pending: pendingOrders
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== ADMIN ROUTES ====================

// Get All Orders (Admin only)
route.get("/getAllOrders", authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      deliveryMethod,
      search
    } = req.query;

    const query = {};

    // Filter by status
    if (status === 'pending') {
      query.isPaymentDone = false;
    } else if (status === 'paid') {
      query.isPaymentDone = true;
      query.isPacked = false;
    } else if (status === 'packed') {
      query.isPacked = true;
      query.isDelivered = false;
    } else if (status === 'delivered') {
      query.isDelivered = true;
    }

    // Filter by delivery method
    if (deliveryMethod && ['pickup', 'delivery'].includes(deliveryMethod)) {
      query.deliveryMethod = deliveryMethod;
    }

    // Search by user ID or product ID
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: 'i' } },
        { productId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalOrders: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Order by ID (Admin)
route.get("/admin/getOrderById", authenticateAdmin, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await Order.findById(Id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update Order Status (Admin only)
route.put("/updateStatus", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.query;
    const { isPacked, isCallDone, isDelivered, isPaymentDone } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const updateData = {};
    if (isPacked !== undefined) updateData.isPacked = isPacked;
    if (isCallDone !== undefined) updateData.isCallDone = isCallDone;
    if (isDelivered !== undefined) updateData.isDelivered = isDelivered;
    if (isPaymentDone !== undefined) updateData.isPaymentDone = isPaymentDone;

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete Order (Admin only)
route.delete("/deleteOrder", authenticateAdmin, async (req, res) => {
  try {
    const { Id } = req.query;

    if (!Id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await Order.findByIdAndDelete(Id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Order Statistics (Admin)
route.get("/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ isPaymentDone: false });
    const paidOrders = await Order.countDocuments({ isPaymentDone: true, isPacked: false });
    const packedOrders = await Order.countDocuments({ isPacked: true, isDelivered: false });
    const deliveredOrders = await Order.countDocuments({ isDelivered: true });
    
    const pickupOrders = await Order.countDocuments({ deliveryMethod: 'pickup' });
    const deliveryOrders = await Order.countDocuments({ deliveryMethod: 'delivery' });

    res.status(200).json({
      success: true,
      stats: {
        total: totalOrders,
        pending: pendingOrders,
        paid: paidOrders,
        packed: packedOrders,
        delivered: deliveredOrders,
        pickup: pickupOrders,
        delivery: deliveryOrders
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