const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      default: "",
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: false,
      default: "",
    },
    nearByLocation: {
      type: String,
      required: false,
      default: "",
    },
    city: {
      type: String,
      required: false,
      default: "",
    },
    walletAmount: {
      type: String,
      required: false,
      default: 0,
    },
    referralCode: {
      type: String,
      required: false,
      default: "",
    },
    pincode: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("userData", userSchema);
