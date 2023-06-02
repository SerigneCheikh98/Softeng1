import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as controller from '../controllers/controller';
import { categories, transactions } from '../models/model';
import { createCategory, updateCategory, deleteCategory, getCategories, getAllTransactions, deleteTransactions, deleteTransaction, getTransactionsByGroupByCategory } from '../controllers/controller';
import { Group, User } from '../models/User';
import { verifyAuth } from '../controllers/utils';
import { response } from 'express';

jest.mock('../models/model');
jest.mock('../models/User');

beforeEach(() => {
  categories.find.mockClear();
  categories.findOne.mockClear();
  categories.findOneAndUpdate.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.findOne.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.updateMany.mockClear();
  transactions.prototype.save.mockClear();
  Group.findOne.mockClear();
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
        const res = { authorized: true, cause: "Authorized" };
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
        const res = { authorized: true, cause: "Authorized" };
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
        const res = { authorized: true, cause: "Authorized" };
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
                type: "AlreadyExist",
                color: "cyan"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { authorized: true, cause: "Authorized" };
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
        const res = { authorized: false, cause: "Admin: Mismatched role" };
        const response = { error: res.cause };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)

        await createCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.prototype.save).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });
})

/**
 * - Request Parameters: A string equal to the `type` of the category that must be edited
 *   - Example: `api/categories/food`
 * - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
 *   - Example: `{type: "Food", color: "yellow"}`
 * - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
 *   - Example: `res.status(200).json({data: {message: "Category edited successfully", count: 2}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - In case any of the following errors apply then the category is not updated, and transactions are not changed
 * - Returns a 400 error if the request body does not contain all the necessary attributes
 * - Returns a 400 error if at least one of the parameters in the request body is an empty string
 * - Returns a 400 error if the type of category passed as a route parameter does not represent a category in the database
 * - Returns a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database and that category is not the same as the requested one
 * - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
describe("updateCategory", () => { 
    test('Should update category successfully and return also the number of transactions whose type changed', async () => {
        const mockReq = {
            params: {type: "food"},
            body: {
                type: "grocery",
                color: "blue"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn(),
        }
        const res = { authorized: true, cause: "Authorized" };
        const updated_transactions = {modifiedCount: 5}
        const response = { data: { message: "Category edited successfully", count: updated_transactions.modifiedCount }, refreshedTokenMessage: undefined };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        jest.spyOn(categories, "findOne").mockImplementation(({ type: catType }) => {
            if(catType === mockReq.params.type){
                return { type: "food", color: "red" }
            }
            else if(catType === mockReq.body.type){
                return null
            }
        })
        jest.spyOn(categories, "findOneAndUpdate").mockImplementation(() => { mockReq.body})
        jest.spyOn(transactions, "updateMany").mockImplementation(() => updated_transactions )

        await updateCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.findOne).toHaveBeenCalled()
        expect(categories.findOneAndUpdate).toHaveBeenCalled()
        expect(transactions.updateMany).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if the request body does not contain all the necessary attributes', async () => {
        const mockReq = {
            params: {type: "food"},
            body: {
                type: "grocery",
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { authorized: true, cause: "Authorized" };
        const response = { error: "Some Parameter is Missing" };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        
        await updateCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if at least one of the parameters in the request body is an empty string', async () => {
        const mockReq = {
            params: {type: "food"},
            body: {
                type: " ",
                color: "blue"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { authorized: true, cause: "Authorized" };
        const response = { error: "Some Parameter is an Empty String" };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        
        await updateCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if the type of category passed as a route parameter does not represent a category in the database', async () => {
        const mockReq = {
            params: {type: "ghost"},
            body: {
                type: "grocery",
                color: "blue"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { authorized: true, cause: "Authorized" };
        const response = { error: 'This category does not exist.' };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        jest.spyOn(categories, "findOne").mockImplementation(() => { return null })
        
        await updateCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.findOne).toHaveBeenCalled()
        //expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if the type of category passed in the request body as the new type represents an already existing category in the database and that category is not the same as the requested one', async () => {
        const mockReq = {
            params: {type: "food"},
            body: {
                type: "grocery",
                color: "blue"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn(),
        }
        const res = { authorized: true, cause: "Authorized" };
        const response = { error: 'New Category Type already exists.' };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        jest.spyOn(categories, "findOne").mockImplementation(({ type: catType }) => {
            if(catType === mockReq.params.type){
                return { type: "food", color: "red" }
            }
            else if(catType === mockReq.body.type){
                return { type: "grocery", color: "red" }
            }
        })
        
        await updateCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.findOne).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if called by an authenticated user who is not an admin (authType = Admin)', async () => {
        const mockReq = {
            params: {type: "food"},
            body: {
                type: "grocery",
                color: "blue"
            }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }
        const res = { authorized: false, cause: "Admin: Mismatched role" };
        const response = { error: res.cause };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        
        await updateCategory(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });
})

/**
 * - Request Parameters: None
 * - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
 *   - Example: `{types: ["health"]}`
 * - Response `data` Content: An object with an attribute `message` that confirms successful deletion and an attribute `count` that specifies the number of transactions that have had their category type changed
 *   - Example: `res.status(200).json({data: {message: "Categories deleted", count: 1}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - Given N = categories in the database and T = categories to delete:
 *   - If N > T then all transactions with a category to delete must have their category set to the oldest category that is not in T
 *   - If N = T then the oldest created category cannot be deleted and all transactions must have their category set to that category
 * - In case any of the following errors apply then no category is deleted
 * - Returns a 400 error if the request body does not contain all the necessary attributes
 * - Returns a 400 error if called when there is only one category in the database
 * - Returns a 400 error if at least one of the types in the array is an empty string
 * - Returns a 400 error if the array passed in the request body is empty
 * - Returns a 400 error if at least one of the types in the array does not represent a category in the database
 * - Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
describe("deleteCategory", () => {
    test('Should delete successfully the given categories', async () => {
        /*
        N > T
        N < T
        N = T
        N = 1 AND T = 1
        */
    });

    test('Should return error if the request body does not contain all the necessary attributes', async () => {
        const mockReq = {
            body: { types: ["health"] }
        }
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn(),
        }
    });

    test('Should return error if called when there is only one category in the database', async () => {

    });

    test('Should return error if at least one of the types in the array is an empty string', async () => {

    });

    test('Should return error if the array passed in the request body is empty', async () => {

    });
    
    test('Should return error if at least one of the types in the array does not represent a category in the database', async () => {

    });

    test('Should return error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

    });
})

/**
 * - Request Parameters: None
 * - Request Body Content: None
 * - Response `data` Content: An array of objects, each one having attributes `type` and `color`
 *   - Example: `res.status(200).json({data: [{type: "food", color: "red"}, {type: "health", color: "green"}], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
 * - Returns a 401 error if called by a user who is not authenticated (authType = Simple)
 */
describe("getCategories", () => {
    test('Should return all the categories on database', async () => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn(),
        }

        const res = { authorized: true, cause: "Authorized" };
        const resCategories = [{type: "food", color: "red"}, {type: "health", color: "green"}];
        const response = {data: resCategories, refreshedTokenMessage: undefined};

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        jest.spyOn(categories, "find").mockImplementation(() => { return resCategories })
        
        await getCategories(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.find).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('Should return error if called by a user who is not authenticated (authType = Simple)', async() => {
        const mockReq = {}
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        const res = { authorized: false, cause: "Unauthorized" };
        const response = { error: res.cause };

        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => res)
        
        await getCategories(mockReq, mockRes)

        expect(verifyAuth).toHaveBeenCalled()
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });
})

describe("createTransaction", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
/*Request Parameters: None
Request Body Content: None
Response data Content: An array of objects, each one having attributes username, type, amount, date and color
Example: res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})
Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)*/


describe.skip("getAllTransactions", () => {
    test('should return transactions with category information for Admin (200)', async () => {
        // Mock the verifyAuth function to return successful admin authentication
        verifyAuth.mockReturnValue({ flag: true, cause: "Authorized" });

        // Mock the transactions.aggregate function to return mock data
        transactions.aggregate.mockResolvedValue([
            {
                username: 'user1',
                type: 'expense',
                amount: 50,
                date: '2023-05-30',
                categories_info: { color: 'red' },
            },
            {
                username: 'user2',
                type: 'income',
                amount: 100,
                date: '2023-05-29',
                categories_info: { color: 'green' },
            },
        ]);

        // Prepare mock request and response objects
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: { refreshedTokenMessage: 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls' },
        };

        // Call the getAllTransactions function
        await getAllTransactions(req, res);

        // Assert the expected behavior

        // Verify that verifyAuth was called with the correct arguments
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });

        // Verify that transactions.aggregate was called with the correct aggregation pipeline
        expect(transactions.aggregate).toHaveBeenCalledWith([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'type',
                    foreignField: 'type',
                    as: 'categories_info',
                },
            },
            { $unwind: '$categories_info' },
        ]);

        // Verify that the response status code and JSON payload are correct
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                {
                    username: 'user1',
                    type: 'expense',
                    amount: 50,
                    date: '2023-05-30',
                    color: 'red',
                },
                {
                    username: 'user2',
                    type: 'income',
                    amount: 100,
                    date: '2023-05-29',
                    color: 'green',
                },
            ],
            refreshedTokenMessage: 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls',
        });
    });

    test('should return error for non-admin users (401)', async () => {
        // Mock the verifyAuth function to return unsuccessful authentication
        verifyAuth.mockReturnValue({ flag: false, cause: "Admin: Mismatched role" });

        // Prepare mock request and response objects
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Call the getAllTransactions function
        await getAllTransactions(req, res);

        // Assert the expected behavior

        // Verify that verifyAuth was called with the correct arguments
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });

        // Verify that the response status code and JSON payload are correct
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Admin: Mismatched role" });
    });

    test('should return error for unexpected errors (500)', async () => {
        // Mock the verifyAuth function to throw an error
        verifyAuth.mockImplementation(() => {
            throw new Error('Authentication error');
        });

        // Prepare mock request and response objects
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Call the getAllTransactions function
        await getAllTransactions(req, res);

        // Verify that verifyAuth was called with the correct arguments
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: 'Admin' });

        // Verify that the response status code and JSON payload are correct
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Authentication error' });
    });
});

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

describe.skip("getTransactionsByGroup", () => { 
    test('getTransactionsByGroup, should return 200', async () => {
        // Mock dependencies
        const { Group } = require('./yourModule');
        Group.findOne.mockResolvedValueOnce({ name: 'groupName', members: [] });
    
        // Mock authentication
        const { verifyAuth } = require('./yourModule');
        const verifyAuthSpy = jest.spyOn({ verifyAuth }, 'verifyAuth');
        verifyAuthSpy.mockReturnValueOnce({ authorized: true });
    
        // Mock aggregation result
        const transactions = [
          {
            user: { username: 'user1', email: 'user1@example.com' },
            group: { name: 'groupName' },
            category: { type: 'categoryType', color: 'categoryColor' },
            amount: 100,
            date: '2023-05-31',
          },
        ];
        const aggregateMock = jest.fn().mockResolvedValueOnce(transactions);
        const transactionsMock = {
          aggregate: jest.fn(() => ({
            then: jest.fn((callback) => callback(transactions)),
          })),
        };
        jest.doMock('./yourModule', () => ({
          ...jest.requireActual('./yourModule'),
          transactions: transactionsMock,
        }));
    
        await getTransactionsByGroup(req, res);
    
        // Verify mocks
        expect(Group.findOne).toHaveBeenCalledWith({ name: 'groupName' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          data: [
            {
              username: 'user1',
              type: 'categoryType',
              amount: 100,
              date: '2023-05-31',
              color: 'categoryColor',
            },
          ],
          refreshedTokenMessage: undefined,
        });
        expect(verifyAuthSpy).toHaveBeenCalledWith(req, res, { authType: 'Admin' });
        expect(transactionsMock.aggregate).toHaveBeenCalledTimes(1);
        expect(aggregateMock).toHaveBeenCalledTimes(1);
      });
})
describe.skip("getTransactionsByGroupByCategory", () => { 
    test('getTransactionsByGroupByCategory, should return 200', async () => {
        const req = {
            params: {
                name: 'Gruppo1',
                category: 'Food',
            },
            url: '/transactions/groups/Gruppo1',
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {},
        };

        // Set up the mock implementation for Group.findOne
        Group.findOne.mockResolvedValue({
          name: req.params.name,
          members: [
            { email: 'member1@example.com' },
            { email: 'member2@example.com' },
          ],
        });
    
        // Set up the mock implementation for Category.findOne
        categories.findOne.mockResolvedValue({
          type: req.params.category,
        });
        
        // set up the verifyauth 
        const resAuth = { authorized: true, cause: "Authorized" };
        const response = {
            data: [
                {
                    username: 'user1',
                    type: req.params.category,
                    amount: 10,
                    date: '2022-01-01',
                    color: 'blue',
                },
                {
                    username: 'user2',
                    type: req.params.category,
                    amount: 15,
                    date: '2022-01-02',
                    color: 'red',
                },
            ],
            refreshedTokenMessage: undefined,
        };
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)

        // Set up the mock implementation for Transaction.aggregate
        transactions.aggregate.mockResolvedValue([
          {
            user: { username: 'user1', email: 'user1@example.com' },
            group: { name: req.params.name },
            category: { type: req.params.category, color: 'blue' },
            amount: 10,
            date: '2022-01-01',
          },
          {
            user: { username: 'user2', email: 'user2@example.com' },
            group: { name: req.params.name },
            category: { type: req.params.category, color: 'red' },
            amount: 15,
            date: '2022-01-02',
          },
        ]);
    
        await getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: req.params.name });
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.category });
        expect(transactions.aggregate).toHaveBeenCalledWith([
            {
              $lookup: {
                from: 'users',
                localField: 'username',
                foreignField: 'username',
                as: 'user',
              },
            },
            {
              $unwind: '$user',
            },
            {
              $lookup: {
                from: 'groups',
                localField: 'user.email',
                foreignField: 'members.email',
                as: 'group',
              },
            },
            {
              $unwind: '$group',
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'type',
                foreignField: 'type',
                as: 'category',
              },
            },
            {
              $unwind: '$category',
            },
            {
              $match: {
                'group.name': req.params.name,
                'category.type': req.params.category,
              },
            },
            {
              $project: {
                'user.username': 1,
                'user.email': 1,
                'group.name': 1,
                'category.type': 1,
                'amount': 1,
                'date': 1,
                'category.color': 1,
              },
            },
          ]);
          
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(response);
    });

    test('getTransactionsByGroupByCategory with group not found in the database, should return 400', async () => {
        const req = {
            params: {
                name: 'Gruppo1',
                category: 'Food',
            },
            url: '/transactions/groups/Gruppo1',
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {},
        };
        
        const response = { error: "Group not Found." };
        jest.spyOn(Group, "findOne").mockImplementation(() => null)
    
        await getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: req.params.name });        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(response);
    });

    test('getTransactionsByGroupByCategory with category not found in the database, should return 400', async () => {
        const req = {
            params: {
                name: 'Gruppo1',
                category: 'Food',
            },
            url: '/transactions/groups/Gruppo1',
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {},
        };
        
        const group = {
            name: req.params.name,
            members: [
                { email: 'member1@example.com' },
                { email: 'member2@example.com' },
            ],
        };

        const response = { error: "Category not Found." };
        jest.spyOn(Group, "findOne").mockImplementation(() => group)
        jest.spyOn(categories, "findOne").mockImplementation(() => null)

        await getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: req.params.name });  
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.category });        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(response);
    });

    test('getTransactionsByGroupByCategory with user not in the group, should return 401', async () => {
        const req = {
            params: {
                name: 'Gruppo1',
                category: 'Food',
            },
            url: '/api/groups/Gruppo1/transactions/category/Food',
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {},
        };
        
        const group = {
            name: req.params.name,
            members: [
                { email: 'member1@example.com' },
                { email: 'member2@example.com' },
            ],
        };
        const category = req.params.category;

        const resAuth = { authorized: false, cause: "Group: user not in group" };
        const response = { error: "Group: user not in group" };
        jest.spyOn(Group, "findOne").mockImplementation(() => group)
        jest.spyOn(categories, "findOne").mockImplementation(() => category)
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)

        await getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: req.params.name });  
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.category });        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(response);
    });

    test('getTransactionsByGroupByCategory with user not an admin, should return 401', async () => {
        const req = {
            params: {
                name: 'Gruppo1',
                category: 'Food',
            },
            url: '/api/transactions/groups/Gruppo1/category/Food',
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {},
        };
        
        const group = {
            name: req.params.name,
            members: [
                { email: 'member1@example.com' },
                { email: 'member2@example.com' },
            ],
        };
        const category = req.params.category;

        const resAuth = { authorized: false, cause: "Admin: Mismatched role" };
        const response = { error: "Admin: Mismatched role" };
        jest.spyOn(Group, "findOne").mockImplementation(() => group)
        jest.spyOn(categories, "findOne").mockImplementation(() => category)
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)

        await getTransactionsByGroupByCategory(req, res);
    
        expect(Group.findOne).toHaveBeenCalledWith({ name: req.params.name });  
        expect(categories.findOne).toHaveBeenCalledWith({ type: req.params.category });        
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(response);
    });
})

describe.skip("deleteTransaction", () => {
    test('deleteTransaction, should delete the transaction with success', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            params: { username: "Mario" },
            body: {
                _id: "6hjkohgfc8nvu786"
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const Transaction = { _id: "6hjkohgfc8nvu786" };
        const user = { username: "Mario" };

        const resAuth = { authorized: true, cause: "Authorized" };
        // NON SO SE VA BENE
        const response = {data: {message: "Transaction deleted"}, refreshedTokenMessage: undefined};
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        jest.spyOn(User, "findOne").mockImplementation(() => user);
        jest.spyOn(transactions, "findOne").mockImplementation(() => Transaction);
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)
        jest.spyOn(transactions, "deleteOne").mockImplementation(() => null);

        await deleteTransaction(mockReq, mockRes)
        expect(User.findOne).toHaveBeenCalledWith({ username: user.username })
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: Transaction._id, username: user.username })
        expect(transactions.deleteOne).toHaveBeenCalledWith({ _id: Transaction._id })
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransaction with body that does not contain all the necessary attributes, should return 400', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            params: { username: "Mario" },
            body: {
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const response = { error: "Some Parameter is Missing" };

        await deleteTransaction(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransaction with username passed as a route parameter that does not represent a user in the database, should return 400', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            params: { username: "Mario" },
            body: {
                _id: "6hjkohgfc8nvu786"
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const user = { username: "Mario" };

        const response = { error: "User not Found." };
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        jest.spyOn(User, "findOne").mockImplementation(() => null);

        await deleteTransaction(mockReq, mockRes)
        expect(User.findOne).toHaveBeenCalledWith({ username: user.username })
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransaction with the _id in the request body that does not represent a transaction in the database, should return 400', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            params: { username: "Mario" },
            body: {
                _id: "6hjkohgfc8nvu786"
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const Transaction = { _id: "6hjkohgfc8nvu786" };
        const user = { username: "Mario" };

        const response = { error: "Transaction not Found." };
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        jest.spyOn(User, "findOne").mockImplementation(() => user);
        jest.spyOn(transactions, "findOne").mockImplementation(() => null);


        await deleteTransaction(mockReq, mockRes)
        expect(User.findOne).toHaveBeenCalledWith({ username: user.username })
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: Transaction._id, username: user.username })
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransaction called by an authenticated user who is not the same user as the one in the route (authType = User), should return 401', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            params: { username: "Mario" },
            body: {
                _id: "6hjkohgfc8nvu786"
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const Transaction = { _id: "6hjkohgfc8nvu786" };
        const user = { username: "Mario" };

        const resAuth =  { authorized: false, cause: "User: Mismatched users" };
        const response = { error: "User: Mismatched users"};
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        jest.spyOn(User, "findOne").mockImplementation(() => user);
        jest.spyOn(transactions, "findOne").mockImplementation(() => Transaction);
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)

        await deleteTransaction(mockReq, mockRes)
        expect(User.findOne).toHaveBeenCalledWith({ username: user.username })
        expect(transactions.findOne).toHaveBeenCalledWith({ _id: Transaction._id, username: user.username })
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });
})

describe.skip("deleteTransactions", () => {
    test('deleteTransactions, should delete all transactions with success', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            body: {
                _ids: ["6hjkohgfc8nvu786", "6hjkohgfc8nvu788"]
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn(),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const Transactions = [
            { _id: "6hjkohgfc8nvu786" },
            { _id: "6hjkohgfc8nvu788" }
        ];

        const resAuth = { authorized: true, cause: "Authorized" };
        // NON SO SE VA BENE
        const response = {data: {message: "Transactions deleted"}, refreshedTokenMessage: undefined };
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        Transactions.forEach((transaction) => {
            jest.spyOn(transactions, "findOne").mockImplementation(() => transaction);
        });
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)
        Transactions.forEach((transaction) => {
            jest.spyOn(transactions, "deleteOne").mockImplementation(() => null);
        });

        await deleteTransactions(mockReq, mockRes)

        Transactions.forEach((transaction) => {
            expect(transactions.findOne).toHaveBeenCalledWith({ _id: transaction._id })
        });
        Transactions.forEach((transaction) => {
            expect(transactions.deleteOne).toHaveBeenCalledWith({ _id: transaction._id })
        });
        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransactions with body without all necessary attributes, should return 400', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            body: {
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const response = { error: "Some Parameter is Missing" };

        await deleteTransactions(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransactions with at least one of the ids in the array is an empty string, should return 400', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            body: {
                _ids: [" ", "6hjkohgfc8nvu788"]
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const response = { error: "Some Parameter is an Empty String" };
       
        await deleteTransactions(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransactions with at least one of the ids in the array does not represent a transaction in the database, should return 400', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            body: {
                _ids: ["6hjkohgfc8nvu786", "6hjkohgfc8nvu788"]
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "Admin" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const Transactions = [
            { _id: "6hjkohgfc8nvu786" },
            { _id: "6hjkohgfc8nvu788" }
        ];

        const response = { error: "Transaction not found." };

        jest.spyOn(transactions, "findOne").mockImplementation(() => null);

        await deleteTransactions(mockReq, mockRes)

        expect(transactions.findOne).toHaveBeenCalledWith({ _id: Transactions[0]._id })
        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });

    test('deleteTransactions not called by an Admin, should return 401', async () => {
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            body: {
                _ids: ["6hjkohgfc8nvu786", "6hjkohgfc8nvu788"]
            },
            cookies: {
                accessToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
                refreshToken: jwt.sign({ username: 'Mario', email: "mario.red@email.com", role: "User" }, process.env.ACCESS_KEY),
            },
        };

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: jest.fn().mockResolvedValue(null),
            cookie: jest.fn().mockResolvedValue(null),
        }

        const Transactions = [
            { _id: "6hjkohgfc8nvu786" },
            { _id: "6hjkohgfc8nvu788" }
        ];

        const resAuth = { authorized: false, cause: "Admin: Mismatched role" };
        const response = { error: "Admin: Mismatched role" };
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        Transactions.forEach((transaction) => {
            jest.spyOn(transactions, "findOne").mockImplementation(() => transaction);
        });
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)

        await deleteTransactions(mockReq, mockRes)

        Transactions.forEach((transaction) => {
            expect(transactions.findOne).toHaveBeenCalledWith({ _id: transaction._id })
        });
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(response)
    });
})
