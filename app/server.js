require("dotenv").config(); // For environment variables
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlogState,
  editBlog,
  deleteBlog,
  getUserBlogs,
} = require("../controller/blogcontroller");

const authroutes = require("../routes/authroutes"); // Auth routes
const blogroutes = require("../routes/blogroutes"); // Blog routes

const app = express();

mongoose.set("strictQuery", true);

// Middleware
app.use(
  cors({
    origin: "*", // Allow this origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // Parse incoming JSON requests

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

//app.get("/blogs", getBlogs);
//app.get("/blogs/:id", getBlog);

app.use("/", authroutes); // Authentication routes
app.use("/", blogroutes); // Blog routes

// MongoDB Connection
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  "mongodb+srv://shadafunmi421:P6iCaCfKNOxkZ7v4@apicluster.z36wa.mongodb.net/?retryWrites=true&w=majority&appName=apicluster";
if (process.env.NODE_ENV !== "test") {
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
}
module.exports = app;
