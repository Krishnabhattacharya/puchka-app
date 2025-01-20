const express = require("express");
const cartData = require("../models/cartSchema");
const route = express.Router();

// The parent path of all is "*host-url*/api/cartData/*next-routes*"

route.get("/getUserCart", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await cartData.find({ userId: Id });
    res.status(200).json({ cart: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getAllCarts", async (req, res) => {
  try {
    const result = await cartData.find({});

    res.status(200).json({ cart: result, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

route.post("/addCart", async (req, res) => {
  try {
    const cart = await cartData.create({
      userId: req.body.userId,
      productId: req.body.productId,
      quantity: req.body.quantity,
      size: req.body.size,
      color: req.body.color,
      price: req.body.price,
      image: req.body.image,
      title: req.body.title,
      shortDiscription: req.body.shortDiscription,
    });
    res.status(200).json({ cart: cart, success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

route.put("/updateCart", async (req, res) => {
  const Id = req.query.Id;
  try {
    await cartData.updateOne(
      { _id: Id },
      {
        quantity: req.body.quantity,
      }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

route.delete("/deleteCart", async (req, res) => {
  try {
    const Id = req.query.Id;
    await cartData.deleteOne({ _id: Id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = route;
