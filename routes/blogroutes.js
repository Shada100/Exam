const express = require("express");
const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlogState,
  editBlog,
  deleteBlog,
  getUserBlogs,
} = require("../controller/blogcontroller");
const { authenticateJWT } = require("../middleware/authmiddleware");
const router = express.Router();

// Public Routes
router.get("/blogs", getBlogs);
router.get("/blogs/:id", getBlog);

// Private Routes (requires authentication)
router.post("/blogs", authenticateJWT, createBlog);
router.put("/blogs/:id/state", authenticateJWT, updateBlogState);
router.put("/blogs/:id", authenticateJWT, editBlog);
router.delete("/blogs/:id", authenticateJWT, deleteBlog);
router.get("/user/blogs", authenticateJWT, getUserBlogs);


module.exports = router;