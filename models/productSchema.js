const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
    },
    assets: [
      {
        type: {
          type: String, // restrict to 'image' or 'video'
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    colors: [String],
    sizes: [
      {
        sizeName: {
          type: String,
          required: true,
        },
        weightRange: {
          type: String,
          required: true,
        },
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("product", productSchema);
