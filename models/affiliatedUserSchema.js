const mongoose = require("mongoose"); 

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    referredCode: {
      type: String,
      default: null,
    },
    hasPurchased: {
      type: Boolean,
      default: false,
    },
    hasVisitedCart: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
