const express = require("express");
const { generateToken } = require("../middleware/authmiddleware");
const User = require("../models/user");
const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  try {
    const user = await User.create({ first_name, last_name, email, password });
    const token = generateToken(user._id);
    res.status(201).send({ token });
  } catch (error) {
    res.status(400).send("Error creating user");
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid credentials");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(400).send("Invalid credentials");

  // Generate JWT token for the user
  const token = generateToken(user._id);
  res.status(200).send({ token });
});

module.exports = router;
