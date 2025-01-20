const express = require("express");
const orderSchema = require("../models/orderSchema");
const route = express.Router();

// The parent path of all is "*host-url*/api/orderSchema/*next-routes*"

route.get("/getOrderById", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await orderSchema.findOne({ _id: Id });
    res.status(200).json({ order: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});
route.get("/getUserOrders", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await orderSchema.find({ userId: Id });
    res.status(200).json({ order: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getAllOrder", async (req, res) => {
  try {
    const result = await orderSchema.find({});

    res.status(200).json({ order: result, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

route.post("/addOrder", async (req, res) => {
  try {
    const order = await orderSchema.create({
      userId: req.body.userId,
      productId: req.body.productId,
      quantity: req.body.quantity,
      size: req.body.size,
      color: req.body.color,
      price: req.body.price,
      image: req.body.image,
      title: req.body.title,
      shortDiscription: req.body.shortDiscription,
      isDelivered: req.body.isDelivered,
      isPaymentDone: req.body.isPaymentDone,
      deliveryMethod: req.body.deliveryMethod,
    });
    res.status(200).json({ order: order, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

route.put("/updateStatus", async (req, res) => {
  try {
    const id = req.query.id;

    const order = await orderSchema.updateOne(
      { _id: id },
      {
        isPacked: req.body.isPacked,
        isCallDone: req.body.isCallDone,
        isDelivered: req.body.isDelivered,
        isPaymentDone: req.body.isPaymentDone,
      }
    );
    res.status(200).json({ order: order, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

route.delete("/deleteOrder", async (req, res) => {
  try {
    const Id = req.query.Id;
    await orderSchema.deleteOne({ _id: Id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = route;
