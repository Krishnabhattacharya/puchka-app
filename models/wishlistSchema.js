const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const wishlistSchema = new Schema(
  {
    userId: {
      type: String, // Reference to the User collection
      required: true,
    },
    productId: {
      type: String, // Reference to the Product collection
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    shortDiscription: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("wishlistProduct", wishlistSchema);
