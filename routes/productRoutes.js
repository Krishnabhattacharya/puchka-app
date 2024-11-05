const express = require("express");
const productData = require("../models/productSchema");
const route = express.Router();
const upload=require("../utils/upload.js");
const deleteFromCloudinary=require('../utils/delete_images.js');
route.get("/getProductById", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await productData.findOne({ _id: Id });
    res.status(200).json({ product: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});
route.get("/getProductByCategory", async (req, res) => {
  try {
    const category = req.query.category;
    if (category === "all") {
      const result = await productData.find({});
      res.status(200).json({ product: result, success: true });
      return;
    }
    const result = await productData.find({ category: category });
    res.status(200).json({ product: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getAllProduct", async (req, res) => {
  try {
    const result = await productData.find({});

    res.status(200).json({ product: result, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// route.post("/addProduct", async (req, res) => {
//   try {
//     const product = await productData.create({
//       title: req.body.title,
//       category: req.body.category,
//       subCategory: req.body.subCategory,
//       assets: req.body.assets,
//       colors: req.body.colors,
//       sizes: req.body.sizes,
//       price: req.body.price,
//       description: req.body.description,
//     });
//     res.status(200).json({ product: product, success: true });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// });
  route.post("/addProduct", upload.array("files",5), async (req, res) => {
    try {
      const assets = req.files.map(file => ({
        type: file.mimetype.includes("video") ? "video" : "image",
        url: file.path,
      }));

      const product = await productData.create({
        title: req.body.title,
        category: req.body.category,
        subCategory: req.body.subCategory,
        assets: assets,
        colors: JSON.parse(req.body.colors),
        sizes: JSON.parse(req.body.sizes),
        price: req.body.price,
        description: req.body.description,
      });

      res.status(200).json({ product: product, success: true });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
route.put("/updateProduct", async (req, res) => {
  const id = req.query.id;
  try {
    await productData.updateOne(
      { _id: id },
      {
        title: req.body.title,
        category: req.body.category,
        subCategory: req.body.subCategory,
        colors: req.body.colors,
        sizes: req.body.sizes,
        price: req.body.price,
        description: req.body.description,
      }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// route.delete("/deleteProduct", async (req, res) => {
//   try {
//     const Id = req.query.Id;
//     await productData.deleteOne({ _id: Id });
//     res.status(200).json({ success: true });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

route.delete("/deleteProduct", async (req, res) => {
  try {
    const Id = req.query.Id;
    
    const product = await productData.findById(Id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const deletionPromises = product.assets.map(asset => {
      const publicId = asset.url.split('/').pop().split('.')[0]; // Extract public ID
      return deleteFromCloudinary(publicId);
    });
    await Promise.all(deletionPromises);

    await productData.deleteOne({ _id: Id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = route;
