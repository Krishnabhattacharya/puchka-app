const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");

const route = express.Router();
const JWT_SECRET = "golgappa_admin"; // Better to use env variable

// Admin Login
route.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id, role: "admin" }, JWT_SECRET, {
      
    });

    res.status(200).json({
      success: true,
      message: "Admin Login Successful",
      token,
      admin,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
route.post("/create-admin", async (req, res) => {
  const bcrypt = require("bcryptjs");

  const hashed = await bcrypt.hash("Admin@1234", 10);

  const admin = await Admin.create({
    username: "Admin",
    password: hashed
  });

  res.send({ success: true, admin });
});

module.exports = route;
