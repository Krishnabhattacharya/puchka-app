const express = require("express");
const productData = require("../models/productSchema");
const route = express.Router();
const upload = require("../utils/upload.js");
const deleteFromCloudinary = require('../utils/delete_images.js');
const cloudinary = require("../utils/cloudinaryConfig.js");
const fs = require("fs"); // To delete local files after uploading to Cloudinary
const { json } = require("stream/consumers");

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

/*
route.post("/addProduct", upload.array("assets", 10), async (req, res) => {
  try {
    const { title, category, subCategory, colors, price, description, sizes } = req.body;
    let images = null;
    
    if (req.files) {
      images = req.files.map((file) => {
        const type = file.mimetype.split("/")[0];
        return {
          type,
          url: file.path,
        };
      });
    }

    const parsedColors = JSON.parse(colors);
    const parsedSizes = JSON.parse(sizes);

    const newProduct = new productData({
      title,
      category,
      subCategory,
      colors: parsedColors,
      price,
      description,
      sizes: parsedSizes,
      assets: images,
    });

    await newProduct.save();
    res.status(201).json({ message: "Product uploaded successfully!", product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
*/
route.post("/addProduct", (req, res) => {
  upload.array("assets", 10)(req, res, async (multerErr) => {
    if (multerErr) {
      console.error("Multer error:", multerErr);
      if (multerErr.name === "MulterError") {
        return res.status(400).json({ message: multerErr.message });
      }
      return res.status(400).json({ message: multerErr.message || "File upload failed" });
    }

    try {
      console.log("After multer — files present:", Array.isArray(req.files) ? req.files.length : 0);

      const { title, category, subCategory, colors = "[]", price, description, sizes = "[]" } = req.body || {};

      const files = Array.isArray(req.files) ? req.files : [];


      const images = files.map((f) => {
        const url = f.path || f.location || f.secure_url || null;
        const type = (f.mimetype || "").split("/")[0] || "unknown";
        return { type, url };
      });

      let parsedColors, parsedSizes;
      try { parsedColors = typeof colors === "string" ? JSON.parse(colors) : colors; }
      catch { return res.status(400).json({ message: "Invalid JSON for colors" }); }
      try { parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes; }
      catch { return res.status(400).json({ message: "Invalid JSON for sizes" }); }

      if (!title || !category || !price) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const newProduct = new productData({
        title,
        category,
        subCategory,
        colors: parsedColors,
        price,
        description,
        sizes: parsedSizes,
        assets: images,
      });

      await newProduct.save();
      return res.status(201).json({ message: "Product uploaded successfully!", product: newProduct });

    } catch (err) {
      console.error("addProduct error:", err);
      return res.status(500).json({ message: "Internal Server Error", error: err });
    }
  });
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

route.delete("/deleteProduct", async (req, res) => {
  try {
    const Id = req.query.Id;

    const product = await productData.findById(Id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const deletionPromises = product.assets.map(asset => {
      const publicId = asset.url.split('/').pop().split('.')[0];
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
