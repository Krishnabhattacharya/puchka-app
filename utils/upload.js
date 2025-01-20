// upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinaryConfig.js");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_assets",
    allowed_formats: ["jpg", "png", "mp4"],
    resource_type: "auto", // Allows Cloudinary to determine file type
  },
});

const upload = multer({ storage });

module.exports = upload;
