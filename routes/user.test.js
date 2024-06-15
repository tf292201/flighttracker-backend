"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Aircraft = require("../models/aircraftspotted");
const { createToken } = require("../helpers/tokens");

// Sample user data for testing
const testUserData = {
  username: "testuser",
  password: "password",
  email: "testuser@example.com",
};

let token;


beforeEach(async () => {
  // Register a test user and get authentication token
  const user = await User.register(testUserData);
  token = createToken(user);
});

afterEach(async () => {
  // Delete all users and aircrafts after each test
  await User.removeAll();
  await Aircraft.removeAll();
});


describe("POST /users/login", () => {
  test("Valid login should return user and token", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ username: testUserData.username, password: testUserData.password })
      .expect(200);

    expect(response.body).toHaveProperty("user");
    expect(response.body).toHaveProperty("token");
  });

  test("Invalid login should return 401 Unauthorized", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ username: testUserData.username, password: "incorrectpassword" })
      .expect(401);

    expect(response.body).toEqual({ error: "Invalid username/password" });
  });
});

describe("POST /users/logout", () => {
  test("Logout should return message", async () => {
    const response = await request(app)
      .post("/users/logout")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toEqual({ message: "Logout successful" });
  });

  test("Logout without token should return 401 Unauthorized", async () => {
    const response = await request(app)
      .post("/users/logout")
      .expect(401);

    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});

describe("POST /users/register", () => {
  test("Valid registration should return user and token", async () => {
    const newUser = {
      username: "newuser",
      password: "newpassword",
      email: "newuser@example.com",
    };

    const response = await request(app)
      .post("/users/register")
      .send(newUser)
      .expect(201);

    expect(response.body.user.username).toBe(newUser.username);
    expect(response.body).toHaveProperty("token");
  });

  test("Invalid registration should return 400 Bad Request", async () => {
    const invalidUser = {
      username: "testuser", // Existing username
      password: "password",
      email: "testuser@example.com",
    };

    const response = await request(app)
      .post("/users/register")
      .send(invalidUser)
      .expect(400);

    expect(response.body.error).toContain("already exists");
  });
});

describe("GET /users/:username", () => {
  test("Fetch user details with valid token should return user data", async () => {
    const response = await request(app)
      .get(`/users/${testUserData.username}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.user.username).toBe(testUserData.username);
  });

  test("Fetch user details without valid token should return 401 Unauthorized", async () => {
    const response = await request(app)
      .get(`/users/${testUserData.username}`)
      .expect(401);

    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});

describe("DELETE /users/:username", () => {
  test("Delete user with valid token should return deleted username", async () => {
    const response = await request(app)
      .delete(`/users/${testUserData.username}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.deleted).toBe(testUserData.username);
  });

  test("Delete user without valid token should return 401 Unauthorized", async () => {
    const response = await request(app)
      .delete(`/users/${testUserData.username}`)
      .expect(401);

    expect(response.body).toEqual({ error: "Unauthorized" });
  });
});
