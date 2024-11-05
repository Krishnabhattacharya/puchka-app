const express = require("express");
const couponModel = require("../models/couponSchema");

const couponRoutes = express.Router();

// Route to get all coupons
couponRoutes.get("/get-all-coupons", async (req, res) => {
  try {
    const coupons = await couponModel.find();
    res.status(200).send({ message: "All coupons", coupons });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Route to get a single coupon by ID
couponRoutes.get("/verify-coupon", async (req, res) => {
  const couponCode = req.query.code;
  try {
    const coupon = await couponModel.findOne({ code: couponCode });
    if (coupon) {
      res
        .status(200)
        .send({ message: "Coupon verified", success: true, coupon });
    } else {
      throw new Error("Coupon not found");
    }
  } catch (error) {
    res.status(500).send({ message: error.message, success: false });
  }
});

// Route to create a new coupon
couponRoutes.post("/create-coupon", async (req, res) => {
  try {
    const coupon = await couponModel.create(req.body);
    res.status(201).send({ message: "Coupon created", coupon });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Route to update a coupon by ID
couponRoutes.put("/update-coupon/:id", async (req, res) => {
  try {
    const coupon = await couponModel.findByIdAndUpdate(
      { _id: req.params.id },
      req.body
    );
    res.status(200).send({ message: "Coupon updated", coupon });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Route to delete a coupon by ID
couponRoutes.delete("/delete-coupon/:id", async (req, res) => {
  try {
    await couponModel.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: "Coupon deleted" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = couponRoutes;
