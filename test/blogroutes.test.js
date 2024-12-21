const request = require("supertest");
const app = require("../app/server");
const mongoose = require("mongoose");
const User = require("../models/user");
const Blog = require("../models/blog");
const { generateToken } = require("../middleware/authmiddleware");

// Test setup, database connections, and cleanup
beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/blogapi_test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});
beforeEach(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});
});
afterAll(async () => {
  await mongoose.connection.close();
});

// Tests related to user authentication
describe("User Authentication", () => {
  it("should signup a user and return a token", async () => {
    const response = await request(app)
      .post("/user/signup")
      .send({
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        password: "password123",
      })
      .expect(201);

    expect(response.body.token).toBeDefined();
  });

  it("should login a user and return a token", async () => {
    const user = await User.create({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/user/login")
      .send({
        email: user.email,
        password: "password123",
      })
      .expect(200);

    expect(response.body.token).toBeDefined();
  });
});

// Tests related to blog operations
describe("Blog Operations", () => {
  let token;

  beforeAll(async () => {
    const user = await User.create({
      first_name: "Alice",
      last_name: "Smith",
      email: "alice.smith@example.com",
      password: "password123",
    });
    token = generateToken(user._id);
  });

  it("should create a new blog", async () => {
    const response = await request(app)
      .post("/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "The Importance of Code Quality",
        description:
          "This blog discusses the significance of writing clean, maintainable code.",
        body: "Writing quality code is essential for the long-term success of software projects. It makes maintenance easier, reduces bugs, and improves collaboration between developers.",
        tags: ["coding", "best practices", "software development"],
      })
      .expect(201);

    expect(response.body.title).toBe("The Importance of Code Quality");
    expect(response.body.state).toBe("draft");
  });

  it("should get all published blogs", async () => {
    await Blog.create({
      title: "The Future of Web Development",
      description:
        "Exploring the trends and technologies shaping the future of web development.",
      body: "Web development is constantly evolving, with new frameworks, languages, and tools emerging every year. In this blog, we will look at the future of web development.",
      tags: ["web development", "future", "technology"],
      author: token.userId,
      state: "published",
      reading_time: 4,
    });

    const response = await request(app).get("/blogs").expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].state).toBe("published");
  });

  it("should get a single blog and increment read count", async () => {
    const blog = await Blog.create({
      title: "Understanding RESTful APIs",
      description:
        "This blog provides an overview of RESTful APIs and how they are used in modern web applications.",
      body: "RESTful APIs are based on the principles of REST and use standard HTTP methods like GET, POST, PUT, DELETE to interact with resources.",
      tags: ["APIs", "REST", "web services"],
      author: token.userId,
      state: "published",
      reading_time: 3,
    });

    const response = await request(app).get(`/blogs/${blog._id}`).expect(200);

    expect(response.body.read_count).toBe(1);
  });

  it("should update blog state to published", async () => {
    const blog = await Blog.create({
      title: "The Role of AI in Software Development",
      description:
        "How artificial intelligence is changing the landscape of software development.",
      body: "AI is revolutionizing the software development process by automating tasks, enhancing debugging, and improving decision-making.",
      tags: ["AI", "software development", "technology"],
      author: token.userId,
      state: "draft",
      reading_time: 3,
    });

    const response = await request(app)
      .put(`/blogs/${blog._id}/state`)
      .set("Authorization", `Bearer ${token}`)
      .send({ state: "published" })
      .expect(200);

    expect(response.body.state).toBe("published");
  });

  it("should edit a blog", async () => {
    const blog = await Blog.create({
      title: "The Evolution of Frontend Frameworks",
      description:
        "An exploration of how frontend frameworks have evolved over time.",
      body: "Frontend frameworks have evolved from simple JavaScript libraries to complex ecosystems that help developers build scalable applications.",
      tags: ["frontend", "frameworks", "JavaScript"],
      author: token.userId,
      state: "draft",
      reading_time: 4,
    });

    const response = await request(app)
      .put(`/blogs/${blog._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "The Evolution of Frontend Frameworks and Tools",
        description:
          "A deeper dive into the tools and technologies that are shaping frontend development.",
        body: "In addition to popular frameworks like React and Angular, there are numerous tools that help developers in building efficient applications.",
      })
      .expect(200);

    expect(response.body.title).toBe(
      "The Evolution of Frontend Frameworks and Tools"
    );
  });

  it("should delete a blog", async () => {
    const blog = await Blog.create({
      title: "Introduction to Node.js",
      description: "A beginner-friendly guide to learning Node.js.",
      body: "Node.js is a runtime environment that allows you to run JavaScript on the server side. This blog will introduce the core concepts of Node.js.",
      tags: ["Node.js", "JavaScript", "backend"],
      author: token.userId,
      state: "published",
      reading_time: 3,
    });

    const response = await request(app)
      .delete(`/blogs/${blog._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe("Blog deleted successfully");
  });

  it("should get a list of blogs by the user", async () => {
    const blog1 = await Blog.create({
      title: "Exploring New JavaScript Features",
      description:
        "An overview of new JavaScript features introduced in the latest ES versions.",
      body: "With each new release of JavaScript, new features and enhancements are added to the language. This blog will cover the most notable changes.",
      tags: ["JavaScript", "ES6", "features"],
      author: token.userId,
      state: "draft",
      reading_time: 2,
    });

    const blog2 = await Blog.create({
      title: "Understanding Asynchronous Programming",
      description:
        "A guide to understanding asynchronous programming in JavaScript.",
      body: "Asynchronous programming allows non-blocking operations, such as reading from files or fetching data from an API, to be performed in parallel.",
      tags: ["JavaScript", "async", "programming"],
      author: token.userId,
      state: "published",
      reading_time: 4,
    });

    const response = await request(app)
      .get("/user/blogs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.length).toBe(2);
  });
});

// Tests related to unauthorized access
describe("Unauthorized Access", () => {
  it("should return 403 if token is not provided", async () => {
    const response = await request(app)
      .post("/blogs")
      .send({
        title: "Unauthorized Blog",
        description: "This blog should not be created without a valid token.",
        body: "Unauthorized access should be blocked when no token is provided.",
        tags: ["unauthorized"],
      })
      .expect(403);

    expect(response.body.message).toBe("Access denied");
  });

  it("should return 403 for invalid token", async () => {
    const response = await request(app)
      .post("/blogs")
      .set("Authorization", "Bearer invalidtoken")
      .send({
        title: "Invalid Token Blog",
        description: "This blog should not be created with an invalid token.",
        body: "Access should be denied if the token is invalid.",
        tags: ["invalid", "token"],
      })
      .expect(403);

    expect(response.body.message).toBe("Invalid or expired token");
  });
});
