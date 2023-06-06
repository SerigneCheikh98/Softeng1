import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import jwt from 'jsonwebtoken';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

const bcrypt = require("bcryptjs")
/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

//necessary setup to ensure that each test can insert the data it needs
beforeEach(async () => {
  await User.deleteMany({})
  await Group.deleteMany({})
});

/**
* Alternate way to create the necessary tokens for authentication without using the website
*/
const adminAccessTokenValid = jwt.sign({
  email: "admin@email.com",
  //id: existingUser.id, The id field is not required in any check, so it can be omitted
  username: "admin",
  role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

const testerAccessTokenValid = jwt.sign({
  email: "tester@test.com",
  username: "tester",
  role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

//These tokens can be used in order to test the specific authentication error scenarios inside verifyAuth (no need to have multiple authentication error tests for the same route)
const testerAccessTokenExpired = jwt.sign({
  email: "tester@test.com",
  username: "tester",
  role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })
const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" })

/**
 * - Request Parameters: None
 * - Request Body Content: None
 * - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
 *    - Example: `res.status(200).json({data: [{username: "Mario", email: "mario.red@email.com", role: "Regular"}, {username: "Luigi", email: "luigi.red@email.com", role: "Regular"}, {username: "admin", email: "admin@email.com", role: "Regular"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
describe("getUsers", () => {
  test("Returns empty list if there are no users", async () => {
    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
  });

  test("Returns all users in database", async () => {
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
    }, {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    }])

    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([{
      username: "tester",
      email: "tester@test.com",
      role: "Regular",
    }, {
      username: "admin",
      email: "admin@email.com",
      role: "Admin"
    }])
  });

  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    await User.create({
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    })
    const response = await request(app)
      .get("/api/users")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty("error")
  });
})

/**
 * - Request Parameters: A string equal to the `username` of the involved user
 *    - Example: `/api/users/Mario`
 * - Request Body Content: None
 * - Response `data` Content: An object having attributes `username`, `email` and `role`.
 *    - Example: `res.status(200).json({data: {username: "mario", email: "mario.red@email.com", role: "Regular"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - Returns a 400 error if the username passed as the route parameter does not represent a user in the database
 * - Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)
*/
describe("getUser", () => { 
  test("Returns the requested username by User", async () => {
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
    }, 
    {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    }])

    const response = await request(app)
      .get("/api/users/tester")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      username: "tester",
      email: "tester@test.com",
      role: "Regular",
    })
  });

  test("Returns the requested username by Admin", async () => {
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
    }, 
    {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    },
    {
      username: "mario",
      email: "mario@test.com",
      password: "securepassword",
    }])

    const response = await request(app)
      .get("/api/users/mario")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      username: "mario",
      email: "mario@test.com",
      role: "Regular",
    })
  });

  test("Returns a 400 error if the username passed as the route parameter does not represent a user in the database", async () => {
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
    }, 
    {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    }])

    const response = await request(app)
      .get("/api/users/itachi")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error")
  });

  test("Returns a 401 error if called by an authenticated user who is neither the same user as the parameter (authType = User) nor an admin (authType = Admin)", async () => {
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
    }, 
    {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    }])

    const response = await request(app)
      .get("/api/users/mario")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty("error")
  });
})

describe("createGroup", () => { })

describe("getGroups", () => { })

describe("getGroup", () => { })

describe("addToGroup", () => { })

describe("removeFromGroup", () => { })

describe("deleteUser", () => { })

describe("deleteGroup", () => { })
