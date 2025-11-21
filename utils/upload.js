const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinaryConfig.js");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "product_assets",
    allowed_formats: ["jpg", "png", "mp4"],
    resource_type: "auto",
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "video/mp4", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
