// // utils/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure 'uploads' folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer to store files in 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Files will be stored in 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Generates a unique filename to prevent collisions
  },
});

const upload = multer({ storage });
module.exports = upload;

// const multer = require("multer");
// const path = require("path");

// console.log("upload");

// Configure Multer to store files in a temporary folder called 'uploads'
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     console.log("Hi");
//     cb(null, "uploads/"); // Files will be stored locally in this folder
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${file.originalname}`; // Use backticks for template literals
//     console.log(uniqueName);
//     cb(null, uniqueName); // Generates a unique filename to prevent collisions
//   },
// });

// console.log("upload2");

// const upload = multer({ storage }).array('assets'); // Configure for multiple files with field name 'assets'

// module.exports = upload;