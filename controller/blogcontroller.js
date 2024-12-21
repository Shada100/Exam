const Blog = require("../models/blog").default;
const User = require("../models/user");

// Helper function to calculate reading time (approx. 200 words per minute)
const calculateReadingTime = (body) => {
  const words = body.split(" ").length;
  return Math.ceil(words / 200);
};

// Create a new blog (in draft state)
const createBlog = async (req, res) => {
  const { title, description, body, tags } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).send("User not found");
  if (!title || !body) {
    return res.status(400).send("Title and body are required");
  }

  const readingTime = calculateReadingTime(body);
  const blog = new Blog({
    title,
    description,
    body,
    tags,
    author: req.userId,
    reading_time: readingTime,
  });

  await blog.save();
  res.status(201).send(blog);
};

// Get list of blogs (paginated, searchable, and filterable)
const getBlogs = async (req, res) => {
  const { page = 1, limit = 20, search, state, sortBy } = req.query;
  const query = { state: state || "published" };

  if (search) {
    query.$or = [
      { title: new RegExp(search, "i") },
      { tags: new RegExp(search, "i") },
      { "author.first_name": new RegExp(search, "i") },
      { "author.last_name": new RegExp(search, "i") },
    ];
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = -1; // Sort descending
  }
  const validSortFields = ["read_count", "reading_time", "timestamp"];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return res.status(400).send("Invalid sort field");
  }

  
  const blogs = await Blog.find(query)
    .populate("author", "first_name last_name email") // Populate author details
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).send(blogs);
};

// Get a single blog with updated read count
const getBlog = async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id).populate(
    "author",
    "first_name last_name email"
  );
  if (!blog) return res.status(404).send("Blog not found");

  blog.read_count += 1;
  await blog.save();

  res.status(200).send(blog);
};

// Update blog state (from draft to published)
const updateBlogState = async (req, res) => {
  const { id } = req.params;
  const { state } = req.body;

  if (!["draft", "published"].includes(state)) {
    return res.status(400).send("Invalid state");
  }

  const blog = await Blog.findById(id);
  if (!blog) return res.status(404).send("Blog not found");
  if (blog.author.toString() !== req.userId)
    return res.status(403).send("Not authorized");

  blog.state = state;
  await blog.save();

  res.status(200).send(blog);
};

// Edit a blog (draft or published)
const editBlog = async (req, res) => {
  const { id } = req.params;
  const { title, description, body, tags } = req.body;

  const blog = await Blog.findById(id);
  if (!blog) return res.status(404).send("Blog not found");
  if (blog.author.toString() !== req.userId)
    return res.status(403).send("Not authorized");
  if (!title && !description && !body && !tags) {
    return res
      .status(400)
      .send("At least one field is required to update the blog");
  }

  blog.title = title || blog.title;
  blog.description = description || blog.description;
  blog.body = body || blog.body;
  blog.tags = tags || blog.tags;
  blog.reading_time = calculateReadingTime(blog.body);

  await blog.save();
  res.status(200).send(blog);
};

// Delete a blog
const deleteBlog = async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);
  if (!blog) return res.status(404).send("Blog not found");
  if (blog.author.toString() !== req.userId)
    return res.status(403).send("Not authorized");

  await blog.remove();
  res.status(200).send({ message: "Blog deleted successfully" });
};

// Get list of blogs by a user
const getUserBlogs = async (req, res) => {
  const blogs = await Blog.find({ author: req.userId });
  res.status(200).send(blogs);
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlogState,
  editBlog,
  deleteBlog,
  getUserBlogs,
};
