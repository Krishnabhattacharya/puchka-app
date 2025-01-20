const express = require("express");
const wishlist = require("../models/wishlistSchema");
const route = express.Router();

// The parent path of all is "*host-url*/api/wishlist/*next-routes*"

route.get("/getUserWishlist", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await wishlist.find({ userId: Id });
    res.status(200).json({ wishlist: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getAllWishlist", async (req, res) => {
  try {
    const result = await wishlist.find({});

    res.status(200).json({ wishlist: result, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

route.post("/addWishlist", async (req, res) => {
  try {
    const userWishlist = await wishlist.create({
      userId: req.body.userId,
      productId: req.body.productId,
      price: req.body.price,
      image: req.body.image,
      title: req.body.title,
      shortDiscription: req.body.shortDiscription,
    });
    res.status(200).json({ wishlist: userWishlist, success: true });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// route.put("/updatewishlist", async (req, res) => {
//   const Id = req.query.Id;
//   try {
//     await wishlist.updateOne(
//       { _id: Id },
//       {
//         quantity: req.body.quantity,
//         size: req.body.size,
//         color: req.body.color,
//       }
//     );
//     res.status(200).json({ success: true });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

route.delete("/deleteWishlist", async (req, res) => {
  try {
    const Id = req.query.Id;
    await wishlist.deleteOne({ _id: Id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = route;
