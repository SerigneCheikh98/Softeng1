import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { getUsers, getUser  } from '../controllers/users';
import { verifyAuth } from '../controllers/utils';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear()
  //additional `mockClear()` must be placed here
  User.findOne.mockClear()
});

describe("getUsers", () => {
  test.skip("should return empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    jest.spyOn(User, "find").mockImplementation(() => [])
    const response = await request(app)
      .get("/api/users")

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test.skip("should retrieve list of all users", async () => {
    const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', password: 'hashedPassword1' }, { username: 'test2', email: 'test2@example.com', password: 'hashedPassword2' }]
    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers)
    const response = await request(app)
      .get("/api/users")

    expect(response.status).toBe(200)
    expect(response.body).toEqual(retrievedUsers)
  })
})

/*
- Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario`
- Request Body Content: None
- Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Example: `res.status(200).json({data: {username: "mario", email: "mario.red@email.com", role: "Regular"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the username passed as the route parameter does not represent a user in the database
- Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)
*/
describe("getUser", () => {
  const VerifyAuthmodule = require('../controllers/utils');

  test("should retrieve the requested username by User", async () => {
    const mockReq = {
      params: {username: "maurizio"},
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }
   
    const retrieveUser = {username: 'maurizio', email: 'maurizio.mo@polito.it', role: 'Regular'};
    const res = { authorized: true, cause: "Authorized" };
    const response = {data: retrieveUser, refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)  
    jest.spyOn(User, "findOne").mockImplementation(() => retrieveUser)

    await getUser(mockReq, mockRes)
    
    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  /*test("should retrieve the requested username by Admin", async () => {
    const mockReq = {
      params: {username: "edith"},
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const retrieveUser = {username: 'edith', email: 'edith.ra@polito.it', role: 'Regular'};
    const res = { authorized: true, cause: "Authorized" };
    const response = {data: retrieveUser, refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res) 
    jest.spyOn(User, "findOne").mockImplementation(() => retrieveUser)

    await getUser(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })*/

  test("should return empty list if user not found", async () => { 
    const mockReq = {
      params: {username: "unRegisteredUser"},
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const res = { authorized: true, cause: "Authorized" };
    const response = { message: "User not found" };

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res) 
    jest.spyOn(User, "findOne").mockImplementation(() => {})

    await getUser(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should return error if authenticated user mismatch with username and is not admin", async () => {
    const mockReq = {
      params: {"username": "mario"},
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const response = { authorized: false, cause: "User: Mismatched users" };

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => response) 
    jest.spyOn(User, "findOne").mockImplementation(() => {})

    await getUser(mockReq, mockRes)

    expect(User.findOne).not.toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith( {error: response.cause} )
  })
})

describe("createGroup", () => { })

describe("getGroups", () => { })

describe("getGroup", () => { })

describe("addToGroup", () => { })

describe("removeFromGroup", () => { })

describe("deleteUser", () => { })

describe("deleteGroup", () => { })