// const mongoose = require("mongoose");
 
// const userSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     referralCode: {
//       type: String,
//       unique: true, // Make sure each referral code is unique
//     },
//     referredUsers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User", // Users referred by this affiliate
//       },
//     ],
//     commission: {
//       type: Number,
//       default: 0, // Rewards for referrals
//     },
//     totalCommission: {
//       type: Number,
//       default: 0, // Total commission earned by this affiliate
//     },
//     referralsMade: {
//       type: Number,
//       default: 0, // Number of successful referrals
//     },
//   },
//   { timestamps: true }
// );

// const Affiliate = mongoose.model("Affiliate", userSchema);
// module.exports = Affiliate;
