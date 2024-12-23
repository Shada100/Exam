const request = require("supertest");
const server = require("../app/server");
const mongoose = require("mongoose");
const http = require("http");
const app = http.createServer(server);

const { faker } = require("@faker-js/faker");
const User = require("../models/user");
const Blog = require("../models/blog");
const { generateToken } = require("../middleware/authmiddleware");

jest.setTimeout(60000); // 60 seconds

mongoose.set("strictQuery", true);

// Global setup
beforeAll(async () => {
  const uri =
    "mongodb+srv://shadafunmi421:P6iCaCfKNOxkZ7v4@apicluster.z36wa.mongodb.net/?retryWrites=true&w=majority&appName=apicluster";
  mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    });
});

beforeEach(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
  //app.close();
});

// Generate random user data
const generateRandomUser = () => ({
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
});

// Generate random blog data
const generateRandomBlog = (authorId) => ({
  title: faker.lorem.sentence(),
  description: faker.lorem.sentences(2),
  body: faker.lorem.paragraphs(3),
  tags: faker.lorem.words(3).split(" "),
  author: authorId,
  state: "draft",
  reading_time: faker.number.int({ min: 1, max: 10 }),
});

// Tests related to user authentication
describe("User Authentication", () => {
  it("should signup a user and return a token", async () => {
    const user = generateRandomUser();

    const response = await request(app).post("/signup").send(user).expect(201);

    expect(response.body.token).toBeDefined();
  });

  it("should login a user and return a token", async () => {
    const user = generateRandomUser();
    await User.create(user);

    const response = await request(app)
      .post("/login")
      .send({ email: user.email, password: user.password })
      .expect(200);

    expect(response.body.token).toBeDefined();
  });
});

// Tests related to blog operations
describe("Blog Operations", () => {
  let token;
  let userId;

  beforeEach(async () => {
    const user = generateRandomUser();
    const createdUser = await User.create(user);
    userId = createdUser._id;
    token = generateToken(userId);
  });

  it("should create a new blog", async () => {
    const blogData = generateRandomBlog(userId);

    const response = await request(app)
      .post("/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(blogData)
      .expect(201);

    expect(response.body.title).toBe(blogData.title);
    expect(response.body.state).toBe("draft");
  });

  it("should get all published blogs", async () => {
    const blogData = { ...generateRandomBlog(userId), state: "published" };
    await Blog.create(blogData);

    const response = await request(app).get("/blogs").expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].state).toBe("published");
  });

  it("should get a single blog and increment read count", async () => {
    const blogData = { ...generateRandomBlog(userId), state: "published" };
    const blog = await Blog.create(blogData);

    const response = await request(app).get(`/blogs/${blog._id}`).expect(200);

    expect(response.body.read_count).toBe(1);
  });

  it("should update blog state to published", async () => {
    const blogData = generateRandomBlog(userId);
    const blog = await Blog.create(blogData);

    const response = await request(app)
      .put(`/blogs/${blog._id}/state`)
      .set("Authorization", `Bearer ${token}`)
      .send({ state: "published" })
      .expect(200);

    expect(response.body.state).toBe("published");
  });

  it("should edit a blog", async () => {
    const blogData = generateRandomBlog(userId);
    const blog = await Blog.create(blogData);

    const updatedData = {
      title: faker.lorem.sentence(),
      description: faker.lorem.sentences(2),
      body: faker.lorem.paragraphs(2),
    };

    const response = await request(app)
      .put(`/blogs/${blog._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updatedData)
      .expect(200);

    expect(response.body.title).toBe(updatedData.title);
  });

  it("should delete a blog", async () => {
    const blogData = generateRandomBlog(userId);
    const blog = await Blog.create(blogData);

    const response = await request(app)
      .delete(`/blogs/${blog._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe("Blog deleted successfully");
  });

  it("should get a list of blogs by the user", async () => {
    const blog1 = generateRandomBlog(userId);
    const blog2 = generateRandomBlog(userId);

    await Blog.create(blog1);
    await Blog.create(blog2);

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
    const blogData = generateRandomBlog(null);

    const response = await request(app)
      .post("/blogs")
      .send(blogData)
      .expect(403);

    expect(response.body.message).toBe("Access denied");
  });

  it("should return 403 for invalid token", async () => {
    const blogData = generateRandomBlog(null);

    const response = await request(app)
      .post("/blogs")
      .set("Authorization", "Bearer invalidtoken")
      .send(blogData)
      .expect(403);

    expect(response.body.message).toBe("Invalid or expired token");
  });
});
