import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { getUsers, getUser  } from '../controllers/users';
import { verifyAuth } from '../controllers/utils';
import { response } from 'express';

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
  Group.create.mockClear()
  Group.find.mockClear()
});

const VerifyAuthmodule = require('../controllers/utils');

/**
 * - Request Parameters: None
 * - Request Body Content: None
 * - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
 *    - Example: `res.status(200).json({data: [{username: "Mario", email: "mario.red@email.com"}, {username: "Luigi", email: "luigi.red@email.com"}, {username: "admin", email: "admin@email.com"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
describe("getUsers", () => {
  test("should return empty list if there are no users", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }
    
    const res = { flag: true, cause: "Authorized" };
    const response = {data: [], refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)  
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    jest.spyOn(User, "find").mockImplementation(() => [])
    
    await getUsers(mockReq, mockRes)

    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should retrieve list of all users", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const retrievedUsers = [
      { username: 'test1', email: 'test1@example.com', role: 'Regular' }, 
      { username: 'test2', email: 'test2@example.com', role: 'Regular' }
    ]
    const res = { flag: true, cause: "Authorized" };
    const response = {data: retrievedUsers, refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers)

    await getUsers(mockReq, mockRes)

    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("Should return error if not authorized", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const res = { flag: false, cause: "Admin: Mismatched role" };
    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

    await getUsers(mockReq, mockRes)

    expect(User.find).not.toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith( {error: res.cause} )
  })
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
    const res = { flag: true, cause: "Authorized" };
    const response = {data: retrieveUser, refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)  
    jest.spyOn(User, "findOne").mockImplementation(() => retrieveUser)

    await getUser(mockReq, mockRes)
    
    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should retrieve the requested username by Admin", async () => {
    const mockReq = {
      params: {username: "edith"},
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const retrieveUser = {username: 'edith', email: 'edith.ra@polito.it', role: 'Regular'};
    const res = { flag: true, cause: "Authorized" };
    const response = {data: retrieveUser, refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res) 
    jest.spyOn(User, "findOne").mockImplementation(() => retrieveUser)

    await getUser(mockReq, mockRes)

    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should return empty list if user not found", async () => { 
    const mockReq = {
      params: {username: "unRegisteredUser"},
    }
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const res = { flag: true, cause: "Authorized" };
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

    const response = { flag: false, cause: "User: Mismatched users" };

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => response) 

    await getUser(mockReq, mockRes)

    expect(User.findOne).not.toHaveBeenCalled()
    expect(verifyAuth).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith( {error: response.cause} )
  })
})

describe("createGroup", () => { 
  // expected behaviour for simplest case
  test("should return a group object, with empty array for members already in group and for members not found", async () => {
    const mockReq = {
      params: {name: "testgroup1", memberEmails: ["notingroup1@example.com", "notingroup2@example.com", "notingroup3@example.com" ]}
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn()
    }

    const returnedGroupObject = {name: "testgroup1", members: ["notingroup1@example.com", "notingroup2@example.com", "notingroup3@example.com" ]}
    const res = { flag: true, cause: "Authorized" };
    const response = {data: {group: returnedGroupObject, membersNotFound: [], alreadyInGroup: []}}

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
    jest.spyOn(Group, "create").mockImplementation(() => returnedGroupObject)

    await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)

  })

  test("should return a group object, with non-empty array for members already in group and for members not found", async () => {
    const mockReq = {
      params: {name: "testgroup1", memberEmails: ["notingroup@example.com", "alreadyingroup@example.com", "notfound@example.com" ]}
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn()
    }

    const returnedGroupObject = {name: "testgroup1", members: ["notingroup1@example.com"]}
    const res = { flag: true, cause: "Authorized" };
    const response = {data: {group: returnedGroupObject, membersNotFound: ["notfound@example.com"], alreadyInGroup: ["alreadyingroup@example.com"]}}

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
    jest.spyOn(Group, "create").mockImplementation(() => returnedGroupObject)

    await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should return error if there is already a group with the same name", async () => {
    const mockReq = {
      params: {name: "testgroup1", memberEmails: ["test1@example.com", "test2@example.com", "test2@example.com" ]}
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn()
    }

    const res = { flag: true, cause: "Authorized" };
    const response = {data: {error: "Group already exists"}}

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

    await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should return error if all the member emails do not exist or are already in a group", async () => {
    const mockReq = {
      params: {name: "testgroup1", memberEmails: ["notexists@example.com", "alreadyingroup1@example.com", "alreadyingroup2@example.com" ]}
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn()
    }

    const res = { flag: true, cause: "Authorized" };
    const response = {data: { error: "All memberEmails does not exist or Already in Group" }}

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

    await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  // TODO authentication tests
})

describe("getGroups", () => { 
  test("should return empty list if there are no groups", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const res = { flag: true, cause: "Authorized" };
    const response = {data: [], refreshedTokenMessage: undefined}; // refreshedTokenMessage is to be handled?

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
    jest.spyOn(Group, "find").mockImplementation(() => [])

    await getGroups(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  test("should retrieve list of all groups", async () => {
    const mockReq = {}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: jest.fn(),
    }

    const retrievedGroups = [
      { group: 'testgroup1', members: ["test1@example.com", "test2@example.com"]}, 
      { group: 'testgroup2', members: ["test3@example.com", "test4@example.com"]}
    ]

    const res = { flag: true, cause: "Authorized" };
    const response = {data: retrievedUsers, refreshedTokenMessage: undefined};

    jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
    jest.spyOn(Group, "find").mockImplementation(() => retrievedGroups)

    await getGroups(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(response)
  })

  // TODO authentication tests
})

describe("getGroup", () => { })

describe("addToGroup", () => { })

describe("removeFromGroup", () => { })

describe("deleteUser", () => { })

describe("deleteGroup", () => { })