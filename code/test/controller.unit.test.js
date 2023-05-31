import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { createCategory  } from '../controllers/controller';
import { verifyAuth } from '../controllers/utils';

jest.mock('../models/model');

beforeEach(() => {
  categories.find.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.prototype.save.mockClear();
});

const VerifyAuthmodule = require('../controllers/utils');
/**
 * - Request Parameters: None
 * - Request Body Content: An object having attributes `type` and `color`
 *    - Example: `{type: "food", color: "red"}`
 * - Response `data` Content: An object having attributes `type` and `color`
 *    - Example: `res.status(200).json({data: {type: "food", color: "red"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - Returns a 400 error if the request body does not contain all the necessary attributes
 * - Returns a 400 error if at least one of the parameters in the request body is an empty string
 * - Returns a 400 error if the type of category passed in the request body represents an already existing category in the database
 * - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
describe("createCategory", () => { 
    test('Should return the created category', async () => {
        const mockReq = {
            body: {
                type: "house",
                color: "green"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn(),
        }
        const res = { flag: true, cause: "Authorized" };
        const response = {data: {type: mockReq.body.type , color: mockReq.body.color}, refreshedTokenMessage: undefined};

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        jest.spyOn(categories.prototype, "save").mockResolvedValue();

        await createCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if the request body does not contain all the necessary attributes', async () => {
        const mockReq = {
            body: {
                type: "house",
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { flag: true, cause: "Authorized" };
        const response = { error: "Some Parameter is Missing" };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

        await createCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if at least one of the parameters in the request body is an empty string', async () => {
        const mockReq = {
            body: {
                type: " ",
                color: "green"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { flag: true, cause: "Authorized" };
        const response = { error: "Some Parameter is an Empty String" };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

        await createCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if the type of category passed in the request body represents an already existing category in the database', async () => {
        const mockReq = {
            body: {
                type: "IAlreadyExist",
                color: "cyan"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { flag: true, cause: "Authorized" };
        const response = { error: "Category already exist!" };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        jest.spyOn(categories.prototype, "save").mockRejectedValue();

        await createCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.prototype.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if called by an authenticated user who is not an admin (authType = Admin)', async () => {
        const mockReq = {
            body: {
                type: "house",
                color: "green"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { flag: false, cause: "Admin: Mismatched role" };
        const response = { error: res.cause };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

        await createCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });
})

describe("updateCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getCategories", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("createTransaction", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getAllTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUser", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUserByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroup", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransaction", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
