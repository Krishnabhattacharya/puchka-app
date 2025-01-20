const express = require("express");
const refRoute = express.Router();
const RefCode = require("../models/refCodeSchema");

refRoute.post("/addRefer", async (req, res) => {
  try {
    const { refCode, referredUser } = req.body;
    const refCodeDoc = await RefCode.findOne({
      refCode: refCode,
    });
    if (refCodeDoc) {
      if (refCodeDoc.referredUsers.includes(referredUser)) {
        return res.status(400).send({
          message: "User is already referred",
        });
      }
      refCodeDoc.referredUsers.push(referredUser);
      refCodeDoc.usageCount += 1;
      await refCodeDoc.save();
      res.status(200).send({
        message: "Referral code updated successfully",
        refDoc: refCodeDoc,
      });
    } else {
      const newRefCode = new RefCode({
        refCode,
        referredUsers: [referredUser],
        usageCount: 1,
      });
      await newRefCode.save();

      res.status(200).send({
        message: "Referral code added successfully",
        refDoc: newRefCode,
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
});
refRoute.get("/getRefers/:refCode", async (req, res) => {
  try {
    const refCode = req.params.refCode;
    const refCodeDoc = await RefCode.findOne({
      refCode: refCode,
    });
    if (refCodeDoc) {
      res.status(200).json({
        refCodeDoc,
      });
    } else {
      res.status(404).json({
        message: "Referrals not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = refRoute;
