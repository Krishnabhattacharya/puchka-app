// utils/cloudinary.js
const cloudinary = require("../utils/cloudinaryConfig.js"); // Adjust the path as necessary

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary deletion error:", error.message);
  }
};

module.exports = deleteFromCloudinary;
