const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/User");
const { sendAdminEmail } = require("../utils/mailer");

router.post("/forgot-starpass", async (req, res) => {
  const { email } = req.body;

  const admin = await User.findOne({
    email,
    role: "admin",
    emailVerified: true
  });

  if (!admin) {
    return res
      .status(400)
      .json({ msg: "Verified admin email not found" });
  }

  await sendAdminEmail({
    to: admin.email,
    subject: "Your StarPass Code",
    html: `
      <h3>Admin StarPass Recovery</h3>
      <p>Your current StarPass code is:</p>
      <h2>${admin.starPassCode}</h2>
      <p>Keep this confidential.</p>
    `
  });

  res.json({ msg: "StarPass code sent to verified email" });
});

module.exports = router;
