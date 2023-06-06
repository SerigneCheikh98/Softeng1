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
  await categories.deleteMany({})
  await transactions.deleteMany({})
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

/**
 * - Request Parameters: None
 * - Request Body Content: A string equal to the `email` of the user to be deleted
 *    - Example: `{email: "luigi.red@email.com"}`
 * - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and an attribute that specifies whether the user was also `deletedFromGroup` or not
 *    - Example: `res.status(200).json({data: {deletedTransactions: 1, deletedFromGroup: true}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - If the user is the last user of a group then the group is deleted as well
 * - Returns a 400 error if the request body does not contain all the necessary attributes
 * - Returns a 400 error if the email passed in the request body is an empty string
 * - Returns a 400 error if the email passed in the request body is not in correct email format
 * - Returns a 400 error if the email passed in the request body does not represent a user in the database
 * - Returns a 400 error if the email passed in the request body represents an admin
 * - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
describe("deleteUser", () => { 
  test("Should successfully delete the given user who does not belongs to a group", async () => {
    await categories.create({ type: "food", color: "red" })
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    }, {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    }])
    await transactions.insertMany([{
      username: "tester",
      type: "food",
      amount: 20
    }, {
      username: "tester",
      type: "food",
      amount: 100
    }])

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({ email: "tester@test.com" })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveProperty("deletedTransactions", 2)
    expect(response.body.data).toHaveProperty("deletedFromGroup", false)
  });

  test("Should successfully delete the given user who was with other member in a group", async () => {
    await categories.create({ type: "food", color: "red" })
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    }, {
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

    await transactions.insertMany([{
      username: "tester",
      type: "food",
      amount: 20
    }, {
      username: "mario",
      type: "food",
      amount: 100
    }])

    const userTester = await User.findOne({ email: "tester@test.com" })
    const userMario = await User.findOne({ email: "mario@test.com" })
    await Group.create({name: "holiday", members: [{email: "tester@test.com", user: userTester._id}, {email: "mario@test.com", user: userMario._id}]})
    
    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({ email: "tester@test.com" })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveProperty("deletedTransactions", 1)
    expect(response.body.data).toHaveProperty("deletedFromGroup", true)
    const groups = await Group.count();
    expect(groups).toBe(1)
  });

  test("Should successfully delete the given user who was alone in a group", async () => {
    await categories.create({ type: "food", color: "red" })
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    }, {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    }])
    await transactions.insertMany([{
      username: "tester",
      type: "food",
      amount: 20
    }, {
      username: "tester",
      type: "food",
      amount: 100
    }])

    const userTester = await User.findOne({ email: "tester@test.com" })
    await Group.create({name: "holiday", members: [{email: "tester@test.com", user: userTester._id}]})
    
    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({ email: "tester@test.com" })

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveProperty("deletedTransactions", 2)
    expect(response.body.data).toHaveProperty("deletedFromGroup", true)
    const groups = await Group.count();
    expect(groups).toBe(0)
  });

  test("Should return error if the request body does not contain all the necessary attributes", async () => {
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    })

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send()

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Some Parameter is Missing")
  });

  test("Should return error if the email passed in the request body is an empty string", async () => {
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    })

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({email: " "})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Some Parameter is an Empty String")
  });

  test("Should return error if the email passed in the request body is not in correct email format", async () => {
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    })

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({email: "invalidEmail.polito"})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Invalid email format")
  });

  test("Should return error if the email passed in the request body does not represent a user in the database", async () => {
    await User.create({
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    })

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({email: "tryToDelete.me@polito.it"})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "User Does Not exist")
  });

  test("Should return error if the email passed in the request body represents an admin", async () => {
    await User.insertMany([{
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
    },
    {
      username: "admin2",
      email: "admin2@email.com",
      password: "theOtherAdminHatesMe",
      role: "Admin"
    }])

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({email: "admin2@email.com"})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "User is an Admin,can't delete")
  });

  test("Should return error if called by an authenticated user who is not an admin", async () => {
    await User.create({
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    })

    const response = await request(app)
      .delete("/api/users")
      .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
      .send({ email: "tester@test.com" })

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty("error")
  });
})

describe("deleteGroup", () => { })
