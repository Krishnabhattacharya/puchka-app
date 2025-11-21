const express = require("express");
const userData = require("../models/userSchema.js");
const route = express.Router();
const Otp = require("../models/otp.model");
const jwt=require("jsonwebtoken");
// route.post("/sendOtp", async (req, res) => {
//   try {
//     const { phone } = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     const existingOtp = await Otp.findOne({ phone });
//     if (existingOtp) {
//       await Otp.findByIdAndDelete(existingOtp._id);
//     }

//     await client.messages.create({
//       body: `Your OTP is ${otp}`,
//       from: "+18702283706 ",
//      // from: "+19739474449",
//       to: phone,
//     });

//     const newOtp = new Otp({
//       phone,
//       otp,
//       expiresAt: new Date(Date.now() + 5 * 60 * 1000),
//     });
//     await newOtp.save();

//     res.status(200).send({ message: "OTP sent successfully", otp });
//   } catch (error) {
//     res.status(500).send({ success: false, error: error.message });
//   }
// });

// route.post("/verifyOtp", async (req, res) => {
//   try {
//     const { phone, otp } = req.body;

//     const otpDoc = await Otp.findOne({ phone, otp });
//     if (!otpDoc) {
//       return res.status(400).send({ message: "Invalid OTP" });
//     }

//     if (otpDoc.expiresAt < Date.now()) {
//       await Otp.findByIdAndDelete(otpDoc._id);
//       return res.status(400).send({ message: "OTP has expired" });
//     }

//     if (!otpDoc.verified) {
//       otpDoc.verified = true;
//       await otpDoc.save();

//       //   const user = await User.findOne({ phone });
//       //   if (user) {
//       //     return res.status(200).send({
//       //       success: true,
//       //       message: "OTP verified, user already registered",
//       //       user,
//       //     });
//       //   } else {
//       //     return res.status(200).send({
//       //       success: true,
//       //       message: "OTP verified, user not registered",
//       //       user: null,
//       //     }
//       //     ); 
//       //   }
//       const isUser = await userData.findOne({
//         mobileNumber: phone,
//       });
//       if (isUser) {
//         return res.status(200).send({
//           success: true,
//           message: "OTP verified, user already registered",
//           user: isUser,
//         });
//       } else {
//         function generateRefCode() {
//           return Math.random().toString(16).slice(2, 8);
//         }
//         const user = await userData.create({
//           mobileNumber: phone,
//           referralCode: String(generateRefCode()),
//         });

//         return res
//           .status(200)
//           .send({ success: true, user: user, message: "OTP verified" });
//       }
//     } else {
//       return res.status(400).send({ message: "OTP already used" });
//     }
//   } catch (error) {
//     res.status(500).send({ success: false, error: error.message });
//   }
// });



const JWT_SECRET = "golgappa";
route.post("/register", async (req, res) => {
  try {
    const { mobileNumber, name, password,city, pincode } = req.body;

    const existingUser = await userData.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).send({ success: false, message: "User already exists" });
    }

    const referralCode = Math.random().toString(16).slice(2, 8).toUpperCase();

    const newUser = new userData({
      name,
      mobileNumber,
      password, 
      city,
      pincode,
      referralCode,
    });
    await newUser.save();

    res.status(201).send({ success: true, message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

route.post("/login", async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    const user = await userData.findOne({ mobileNumber });
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }

    const isPasswordValid = await user.comparePassword(password); 
    if (!isPasswordValid) {
      return res.status(401).send({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).send({ success: true, message: "Login successful", token, user });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});



route.get("/getUserById", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await userData.findOne({ _id: Id });
    res.status(200).json({ user: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getUserByReferIf", async (req, res) => {
  try {
    const Id = req.query.Id;

    const result = await userData.findOne({ referralCode: Id });
    res.status(200).json({ user: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getUserByNumber", async (req, res) => {
  try {
    const mobileNumber = req.query.mobileNumber;

    const result = await userData.findOne({ mobileNumber: mobileNumber });
    res.status(200).json({ user: result, success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

route.get("/getAllUser", async (req, res) => {
  try {
    const result = await userData.find({});

    res.status(200).json({ user: result, success: true });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});



route.put("/updateUser", async (req, res) => {
  const id = req.query.id;
  try {
    const user = await userData.updateOne(
      { _id: id },
      {
        name: req.body.name,
        mobileNumber: req.body.mobileNumber,
        address: req.body.address,
        nearByLocation: req.body.nearByLocation,
        city: req.body.city,
        pincode: req.body.pincode,
        walletAmount: req.body.walletAmount,
      }
    );
    const updatedUserData = await userData.findById(id);

    res.status(200).json({ userData: updatedUserData, success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

route.delete("/deleteUser", async (req, res) => {
  try {
    const userId = req.query.userId;
    await userData.deleteOne({ _id: userId });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = route;
