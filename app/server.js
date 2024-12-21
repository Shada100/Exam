require("dotenv").config(); // For environment variables
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authroutes = require("../routes/authroutes"); // Auth routes
const blogroutes = require("../routes/blogroutes"); // Blog routes

const app = express();

mongoose.set("strictQuery", true);

// Middleware
app.use(cors());
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.use("/api/auth", authroutes); // Authentication routes
app.use("/api/blog", blogroutes); // Blog routes

// MongoDB Connection
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  "mongodb+srv://shadafunmi421:P6iCaCfKNOxkZ7v4@apicluster.z36wa.mongodb.net/?retryWrites=true&w=majority&appName=apicluster";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
