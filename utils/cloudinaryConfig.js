// cloudinaryConfig.js
const cloudinary = require("cloudinary").v2;
console.log("from cloudynary");

cloudinary.config({
  cloud_name: "delcuaej9",
  api_key: "422144646849997",
  api_secret: "zEezg3eX2KK9zuaS_TggwaDoIEs",
});

module.exports = cloudinary;
