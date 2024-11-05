const { Schema,model } = require("mongoose");

const refCodeSchema = new Schema(
  {
    refCode: {
      type: String,
      required: true,
    },
    referredUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = model("refCode", refCodeSchema);
