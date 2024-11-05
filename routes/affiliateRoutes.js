const express = require("express");
const affiliateRoute = express.Router();
const AffiliatedUser = require("../models/affiliatedUserSchema");
const AffiliateProgramUser = require("../models/affiliateProgramUserSchema");

// create a route who register user form affiliate program use Model AffiliateProgramUser
affiliateRoute.post("/register", async (req, res) => {
  try {
    const { email, password, commission } = req.body;
    const user = await AffiliateProgramUser.findOne({ email: email });
    if (user) {
      return res.status(400).send({
        message: "Program user already exists",
      });
    }
    const affiliate = new AffiliateProgramUser({
      email,
      password,
      referralCode: String(Math.random().toString(16).slice(2, 7)),
      commission,
    });
    await affiliate.save();
    res.status(201).send({
      message: "Affiliate user registered successfully",
      user: affiliate,
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

// crete a route when referal code is used by app user so use both model
// AffiliateProgramUser and AffiliatedUser
affiliateRoute.post("/addRefer", async (req, res) => {
  try {
    const { refCode, referredUser } = req.body;
    const affiliatedUser = await AffiliatedUser.findOne({
      userId: referredUser,
    });
    if (affiliatedUser) {
      return res.status(400).send({
        message: "User is already referred",
      });
    } else {
      const newAffiliatedUser = new AffiliatedUser({
        userId: referredUser,
        referredCode: refCode,
      });
      await newAffiliatedUser.save();

      const affiliateUser = await AffiliateProgramUser.findOne({
        referralCode: refCode,
      });
      affiliateUser.referredUsers.push(newAffiliatedUser._id);
      affiliateUser.referralsMade += 1;
      affiliateUser.totalCommission += affiliateUser.commission;
      await affiliateUser.save();
      res.status(200).send({
        message: "Referral code added successfully",
        referredUser: newAffiliatedUser,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

// create a update user route if user visit cart or puchse any item
affiliateRoute.put("/updateUser/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const { hasPurchased, hasVisitedCart } = req?.body;
    const affiliatedUser = await AffiliatedUser.findOne({
      userId,
    });
    if (!affiliatedUser) {
      return res.status(400).send({
        message: "User not found",
      });
    }
    if (hasVisitedCart) {
      affiliatedUser.hasVisitedCart = true;
    }
    if (hasPurchased) {
      affiliatedUser.hasPurchased = true;
    }
    const updatedAffiliatedUser = await affiliatedUser.save();
    res.send({ message: "User updated successfully", updatedAffiliatedUser });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

affiliateRoute.get("/getAffiliateUsers", async (req, res) => {
  try {
    const affiliateUsers = await AffiliateProgramUser.find();
    res.status(200).send({
      affiliateUsers,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

affiliateRoute.get("/getReferredUsers", async (req, res) => {
  try {
    const referredUsers = await AffiliatedUser.find();
    res.status(200).send({
      referredUsers,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

// create a route to get affilate program user by email and use .populate to get referred users
affiliateRoute.get("/getAffiliateUserById/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const affiliateUser = await AffiliateProgramUser.findOne({
      _id: id,
    }).populate("referredUsers");
    res.status(200).send({
      affiliateUser,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

// create route for get affiliated user by userId
affiliateRoute.get("/getReferredUserById/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const affiliatedUser = await AffiliatedUser.findOne({
      userId: id,
    });
    res.status(200).send({
      affiliatedUser,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});

module.exports = affiliateRoute;
