const express = require("express");
const productData = require("../models/productSchema");
const route = express.Router();
const upload=require("../utils/upload.js");
const deleteFromCloudinary=require('../utils/delete_images.js');
const cloudinary=require("../utils/cloudinaryConfig.js");
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
  // route.post("/addProduct", upload.array("assets",10), async (req, res) => {
  //   try {
  //     // Parse colors and sizes fields as JSON
  //     //console.log(req.body);
  //     const data = JSON.parse(JSON.stringify(req.body))
  // //console.log(data);
  // console.log(JSON.parse(data.sizes));
  // const size=JSON.parse(data.sizes);
  // const {title,category,subCategory,colors,price,description,sizes}=data;
  //     const assets = [];
  //     for (const file of req.files) {
  //       const result = await cloudinary.uploader.upload(file.path, {
  //         folder: "product_assets",
  //         resource_type: "auto", 
  //       });

  //       assets.push({
  //         type: result.resource_type, // 'image' or 'video'
  //         url: result.secure_url,
  //       });

  //       // Delete local file after uploading to Cloudinary
  //       fs.unlinkSync(file.path);
  //     }

  //     // Create product in the database with provided data and uploaded assets
  //     const product = await productData.create({
  //       title: title,
  //       category: category,
  //       subCategory:subCategory,
  //       assets: assets,
  //       colors: colors,
  //       sizes: size,
  //       price: price, 
  //       description: description,
  //     });

  //     res.status(200).json({ product: product, success: true });
  //   } catch (error) {
  //     console.log(error);
      
  //     res.status(400).json({ success: false, message: error.message });
  //   }
  // });/
  route.post("/addProduct", upload.array("assets", 10), async (req, res) => {
    try {
      const { title, category, subCategory, colors, price, description, sizes } = req.body;
      const images = req.files.map((file) => file.path);
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
        images,
      });
  
      await newProduct.save();
      res.status(201).json({ message: "Product uploaded successfully!", product: newProduct });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
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
