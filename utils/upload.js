// utils/upload.js
const multer = require("multer");
const path = require("path");
console.log("upload");

// Configure Multer to store files in a temporary folder called 'uploads'
const storage = multer.diskStorage({
  
  destination: (req, file, cb) => {
    console.log("Hi");

    cb(null, "uploads/"); // Files will be stored locally in this folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log(uniqueName);
    
    cb(null, uniqueName); // Generates a unique filename to prevent collisions
  },
});
console.log("upload2");

const upload = multer({ storage });

module.exports = upload;
