import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';
import { categories, transactions } from '../models/model';
import {getAllTransactions, deleteTransactions, deleteTransaction, getTransactionsByGroupByCategory } from '../controllers/controller';
import { Group, User } from '../models/User';
import mongoose from 'mongoose';
import * as controller from '../controllers/controller';
import { createCategory } from '../controllers/controller';
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
        const response = { data: { type: mockReq.body.type, color: mockReq.body.color }, refreshedTokenMessage: undefined };

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
                type: "AlreadyExist",
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
/*Request Parameters: None
Request Body Content: None
Response data Content: An array of objects, each one having attributes username, type, amount, date and color
Example: res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})
Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)*/


describe("getAllTransactions", () => {
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

describe("getTransactionsByGroup", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
describe("getTransactionsByGroupByCategory", () => { 
    test('deleteTransaction, should delete the transaction with success', async () => { 
        process.env.ACCESS_KEY = 'EZWALLET';
        const mockReq = {
            params: {name: "Gruppo1",category:"Food"},
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
        
        const group = { name: mockReq.params.name , members: [{email: "mario.red@email.com", user: "6hjkohgfc8nvu786"}]};
        const category = {type: mockReq.params.category , color: "Black"};

        const pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'username',
                    foreignField: 'username',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $lookup: {
                    from: 'groups',
                    localField: 'user.email',
                    foreignField: 'members.email',
                    as: 'group'
                }
            },
            {
                $unwind: '$group'
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'type',
                    foreignField: 'type',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $match: {
                    'group.name': group.name,
                    'category.type' : category.type
                }
            },
            {
                $project: {
                    'user.username': 1,
                    'user.email': 1,
                    'group.name': 1,
                    'category.type': 1,
                    'amount': 1,
                    'date': 1,
                    'category.color': 1
                }
            }
        ];
        
        const mockAggregate = jest.fn(() => ({
            exec: jest.fn().mockResolvedValue([
                {username: "Mario", amount: 100, type: "Food", date: "2023-05-19T00:00:00", color: "Black"}
            ]),
          }));
      
          // Create a mock model
          const mockModel = {
            aggregate: mockAggregate,
          };
      
          // Mock the Mongoose model function
          mongoose.model = jest.fn().mockReturnValue(mockModel);
          
          
        const resAuth = { flag: true, cause: "Authorized" };
        // NON SO SE VA BENE
        const refreshedTokenMessage= undefined;
        const response = {data: [{username: "Mario", amount: 100, type: "Food", date: "2023-05-19T00:00:00", color: "Black"}], refreshedTokenMessage: refreshedTokenMessage};
        //any time the `User.findOne()` method is called jest will replace its actual implementation with the one defined below
        jest.spyOn(Group, "findOne").mockImplementation(() => group);
        jest.spyOn(categories, "findOne").mockImplementation(() => category);
        jest.spyOn(VerifyAuthmodule, "verifyAuth").mockImplementation(() => resAuth)
        jest.spyOn(transactions, "aggregate").mockImplementation(() => response)

        await getTransactionsByGroupByCategory(mockReq, mockRes)

        expect(Group.findOne).toHaveBeenCalledWith({ name: group.name });
        expect(categories.findOne).toHaveBeenCalledWith({ type: category.type });
        // Assert the result
        expect(result).toEqual([
            {username: "Mario", amount: 100, type: "Food", date: "2023-05-19T00:00:00", color: "Black"}
          ]);
/*
    // Verify that the mock aggregate function was called with the correct arguments
    expect(mockAggregate).toHaveBeenCalledWith([
      {
          $lookup: {
              from: 'users',
              localField: 'username',
              foreignField: 'username',
              as: 'user'
          }
      },
      {
          $unwind: '$user'
      },
      {
          $lookup: {
              from: 'groups',
              localField: 'user.email',
              foreignField: 'members.email',
              as: 'group'
          }
      },
      {
          $unwind: '$group'
      },
      {
          $lookup: {
              from: 'categories',
              localField: 'type',
              foreignField: 'type',
              as: 'category'
          }
      },
      {
          $unwind: '$category'
      },
      {
          $match: {
              'group.name': group.name,
              'category.type' : category.type
          }
      },
      {
          $project: {
              'user.username': 1,
              'user.email': 1,
              'group.name': 1,
              'category.type': 1,
              'amount': 1,
              'date': 1,
              'category.color': 1
          }
      }
  ]);
 
    // Verify that the exec function was called
    expect(mockAggregate().exec).toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(200)
  expect(mockRes.json).toHaveBeenCalledWith(response)
});
})
*/
describe("deleteTransaction", () => {
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

        const resAuth = { flag: true, cause: "Authorized" };
        // NON SO SE VA BENE
        const refreshedTokenMessage = undefined;
        const response = { data: { message: "Transaction deleted" }, refreshedTokenMessage: refreshedTokenMessage };
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

        const resAuth = { flag: false, cause: "User: Mismatched users" };
        const response = { error: "User: Mismatched users" };
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

describe("deleteTransactions", () => {
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

        const resAuth = { flag: true, cause: "Authorized" };
        // NON SO SE VA BENE
        const refreshedTokenMessage = undefined;
        const response = { data: { message: "Transactions deleted" }, refreshedTokenMessage: refreshedTokenMessage };
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

        const Transactions = [
            { _id: "6hjkohgfc8nvu786" },
            { _id: "6hjkohgfc8nvu788" }
        ];

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

        const Transactions = [
            { _id: " " },
            { _id: "6hjkohgfc8nvu788" }
        ];

        const response = { error: "Some Parameter is an Empty String" };
        Transactions.forEach((transaction) => {
            jest.spyOn(transactions, "findOne").mockImplementation(() => transaction);
        });

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
        Transactions.forEach((transaction) => {
            jest.spyOn(transactions, "findOne").mockImplementation(() => null);
        });

        await deleteTransactions(mockReq, mockRes)

        Transactions.forEach((transaction) => {
            expect(transactions.findOne).toHaveBeenCalledWith({ _id: transaction._id })
        });
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

        const resAuth = { flag: false, cause: "Admin: Mismatched role" };
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
