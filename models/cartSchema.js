const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cartProductSchema = new Schema(
  {
    userId: {
      type: String, // Reference to the User collection
      required: true,
    },
    productId: {
      type: String, // Reference to the Product collection
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1, // Ensure the quantity is at least 1
      default: 1,
    },
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
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
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("CartProduct", cartProductSchema);
