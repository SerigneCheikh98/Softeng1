import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { categories, transactions } from '../models/model';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

//necessary setup to ensure that each test can insert the data it needs
beforeEach(async () => {
    await categories.deleteMany({})
    await transactions.deleteMany({})
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

describe("createCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
    test('should return transactions for a specific user', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
          username: 'tester',
          type: 'Test Category',
          amount: 100,
          date: new Date(),
        });
        const ret_value = {
            username: Transaction.username,
            type: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date.toISOString(),
            color: 'blue'
        };
        // Make the request
        const response = await request(app)
          .get(`/api/users/${user.username}/transactions`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toStrictEqual(new Array(ret_value));
    });
    test('should return transactions for a specific user without filtering (Admin)', async () => {
        // Create test data
        const user = await User.create({ username: 'admin', email: 'admin@email.com', password: 'admin', role:"Admin" });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
          username: 'admin',
          type: 'Test Category',
          amount: 100,
          date: new Date(),
        });
        const ret_value = {
            username: Transaction.username,
            type: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date.toISOString(),
            color: 'blue'
        };
        // Make the request
        const response = await request(app)
          .get(`/api/transactions/users/${user.username}`)
          .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);
    
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toStrictEqual(new Array(ret_value));
    });
    test('400 error if the username passed as a route parameter does not represent a user in the database', async () => {
        // Make the request
        const response = await request(app)
          .get(`/api/users/tester/transactions`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("User not Found.");
    });
    test('401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is /api/users/:username/transactions', async () => {
        // Make the request
        const response = await request(app)
          .get(`/api/users/fakeUser/transactions`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("User: Mismatched users");
    });
    test('Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/users/:username', async () => {
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
          username: 'tester',
          type: 'Test Category',
          amount: 100,
          date: new Date(),
        });
        // Make the request
        const response = await request(app)
          .get(`/api/transactions/users/${user.username}`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Admin: Mismatched role");
    });
})

describe("getTransactionsByUserByCategory", () => { 
    test('should return transactions for a specific user and category', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
          username: 'tester',
          type: 'Test Category',
          amount: 100,
          date: new Date(),
        });
        const ret_value = {
            username: Transaction.username,
            type: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date.toISOString(),
            color: 'blue'
        };
        // Make the request
        const response = await request(app)
          .get(`/api/users/${user.username}/transactions/category/${category.type}`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toStrictEqual(new Array(ret_value));
    });
    test('400 error if the username passed as a route parameter does not represent a user in the database', async () => {
        // Create test data
        const user = await User.create({ username: 'another_user', email: 'tester@test.com', password: 'tester' });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        // Make the request
        const response = await request(app)
          .get(`/api/users/tester/transactions/category/${category.type}`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("User not Found.");
    });
    test('400 error if the category passed as a route parameter does not represent a category in the database', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        await categories.create({ type: 'Test Category', color: 'blue' });
        // Make the request
        const response = await request(app)
          .get(`/api/users/${user.username}/transactions/category/fakeCategory`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Category not Found.");
    });
    test('401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is /api/users/:username/transactions/category/:category', async () => {
        // Create test data
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        // Make the request
        const response = await request(app)
          .get(`/api/users/fakeUser/transactions/category/${category.type}`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("User: Mismatched users");
    });
    test('401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/users/:username/category/:category', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
          username: 'tester',
          type: 'Test Category',
          amount: 100,
          date: new Date(),
        });
        const ret_value = {
            username: Transaction.username,
            type: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date.toISOString(),
            color: 'blue'
        };
        // Make the request
        const response = await request(app)
          .get(`/api/transactions/users/${user.username}/category/${category.type}`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);
    
        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Admin: Mismatched role");
    });
})

describe("getTransactionsByGroup", () => { 
    test('should return transactions for a specific group', async () => {
        // Create User
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // Create test data
        const group = await Group.create({ name: 'Test Group', members: [{ email: user.email, user: user._id }] });
        await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
            username: 'tester',
            type: 'Test Category',
            amount: 100,
            date: new Date(),
        });
        const ret_value = {
            username: Transaction.username,
            type: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date.toISOString(),
            color: 'blue'
        };
        // Make the request
        const response = await request(app)
            .get(`/api/groups/${group.name}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toStrictEqual(new Array(ret_value));
    });
    test('400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        // Create User
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // Create test data
        const group = await Group.create({ name: 'Test Group', members: [{ email: user.email, user: user._id }] });
        await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
            username: 'tester',
            type: 'Test Category',
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/groups/fakegroup/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Group not Found.");
    });
    test('401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is /api/groups/:name/transactions', async () => {
        // Create test data
        const group = await Group.create({ name: 'Test Group', members: [] });
        await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
            username: 'tester',
            type: 'Test Category',
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/groups/${group.name}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Group: user not in group");
    });
    test('401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/groups/:name', async () => {
        // Create User
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // Create test data
        const group = await Group.create({ name: 'Test Group', members: [{ email: user.email, user: user._id }] });
        await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
            username: 'tester',
            type: 'Test Category',
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/transactions/groups/${group.name}`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Admin: Mismatched role");
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    test('should get all transactions of a certain group and a certain category', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const group = await Group.create({ name: 'Test Group', members: [{email: user.email, user: user._id}] });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        const Transaction = await transactions.create({
            username: 'tester',
            type: category.type,
            amount: 100,
            date: new Date(),
        });
        const ret_value = {
            username: Transaction.username,
            type: Transaction.type,
            amount: Transaction.amount,
            date: Transaction.date.toISOString(),
            color: 'blue'
        };

        // Make the request
        const response = await request(app)
            .get(`/api/groups/${group.name}/transactions/category/${category.type}`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toStrictEqual(new Array(ret_value));
    });
    test('400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const group = await Group.create({ name: 'Test Group', members: [{email: user.email, user: user._id}] });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        let Transaction = await transactions.create({
            username: 'tester',
            type: category.type,
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/groups/falsegroup/transactions/category/${category.type}`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Group not Found.");
    });
    test('400 error if the category passed as a route parameter does not represent a category in the database', async () => {
        // Create test data
        const user = await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        const group = await Group.create({ name: 'Test Group', members: [{email: user.email, user: user._id}] });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        let Transaction = await transactions.create({
            username: 'tester',
            type: category.type,
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/groups/${group.name}/transactions/category/false_category`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Category not Found.");
    });
    test('401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is /api/groups/:name/transactions/category/:category', async () => {
        // Create test data
        const group = await Group.create({ name: 'Test Group', members: [] });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        let Transaction = await transactions.create({
            username: 'tester',
            type: category.type,
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/groups/${group.name}/transactions/category/${category.type}`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Group: user not in group");
    });
    test('401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is /api/transactions/groups/:name/category/:category', async () => {
        // Create test data
        const group = await Group.create({ name: 'Test Group', members: [] });
        const category = await categories.create({ type: 'Test Category', color: 'blue' });
        let Transaction = await transactions.create({
            username: 'tester',
            type: category.type,
            amount: 100,
            date: new Date(),
        });
        // Make the request
        const response = await request(app)
            .get(`/api/transactions/groups/${group.name}/category/${category.type}`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Admin: Mismatched role");
    });
})

describe("deleteTransaction", () => { 
    test('should delete transaction when user authentication is successful and valid ID is provided', async () => {
        const username = 'tester';
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transaction = await transactions.create(
            {
                username: "tester",
                amount: 100,
                type: "cat1",
                date: new Date()
            })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _id: Transaction._id });

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data")
        expect(response.body.data).toHaveProperty("message")
        expect(response.body.data.message).toBe("Transaction deleted")    
    });
    test('400 error if the request body does not contain all the necessary attributes', async () => {
        const username = 'tester';
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send();

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Some Parameter is Missing")
    });
    test('400 error if the _id in the request body is an empty string', async () => {
        const username = 'tester';
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _id: ' ' });

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Some Parameter is an Empty String")
    });
    test('400 error if the username passed as a route parameter does not represent a user in the database', async () => {
        const username = 'tester';
        await User.create({ username: 'wrong', email: 'tester@test.com', password: 'tester' });
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transaction = await transactions.create(
            {
                username: "tester",
                amount: 100,
                type: "cat1",
                date: new Date()
            })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _id: Transaction._id });

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("User not Found.")
    });
    test('400 error if the _id in the request body does not represent a transaction in the database', async () => {
        const username = 'tester';
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _id: mongoose.Types.ObjectId() });

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Transaction not Found.")    
    });
    test('400 error if the _id in the request body represents a transaction made by a different user than the one in the route', async () => {
        const username = 'tester';
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transaction = await transactions.create(
            {
                username: "another_user",
                amount: 100,
                type: "cat1",
                date: new Date()
            })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _id: Transaction._id });

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Transaction not Found.")    
    });
    test('401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)', async () => {
        const username = 'another_user';
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transaction = await transactions.create(
            {
                username: "another_user",
                amount: 100,
                type: "cat1",
                date: new Date()
            })
        //The API request must be awaited as well
        const response = await request(app)
            .delete(`/api/users/${username}/transactions`)
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _id: Transaction._id });

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("User: Mismatched users")    
    });
})

describe("deleteTransactions", () => { 
    test('should delete transactions when admin authentication is successful and valid IDs are provided', async () => {
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transactions = await transactions.insertMany([
            {
                username: "user1",
                amount: 100,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user2",
                amount: 10,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user1",
                amount: 30,
                type: "cat1",
                date: new Date()
            }
        ])
        //The API request must be awaited as well
        const req_body = Transactions.map((t) => t._id);
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ _ids: req_body });

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("data")
        expect(response.body.data).toHaveProperty("message")
        expect(response.body.data.message).toBe("Transactions deleted")    
    });
    test('400 error if the request body does not contain all the necessary attributes', async () => {
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transactions = await transactions.insertMany([
            {
                username: "user1",
                amount: 100,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user2",
                amount: 10,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user1",
                amount: 30,
                type: "cat1",
                date: new Date()
            }
        ])
        //The API request must be awaited as well
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Some Parameter is Missing")    
    });
    test('400 error if at least one of the ids in the array is an empty string', async () => {
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transactions = await transactions.insertMany([
            {
                username: "user1",
                amount: 100,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user2",
                amount: 10,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user1",
                amount: 30,
                type: "cat1",
                date: new Date()
            }
        ])
        //The API request must be awaited as well
        const req_body = Transactions.map((t) => ' ');
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ _ids: req_body });

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Some Parameter is an Empty String")    
    });
    test('400 error if at least one of the ids in the array does not represent a transaction in the database', async () => {
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transactions = await transactions.insertMany([
            {
                username: "user1",
                amount: 100,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user2",
                amount: 10,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user1",
                amount: 30,
                type: "cat1",
                date: new Date()
            }
        ])
        //The API request must be awaited as well
        const req_body = Transactions.map((t) => {
            return mongoose.Types.ObjectId(); // Generate a new ObjectId
        });
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ _ids: req_body });

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Transaction not found.")    
    });
    test('401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {
        // create category
        await categories.create({
            type: "cat1",
            color: "blue"
        })
        // create transactions
        const Transactions = await transactions.insertMany([
            {
                username: "user1",
                amount: 100,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user2",
                amount: 10,
                type: "cat1",
                date: new Date()
            },
            {
                username: "user1",
                amount: 30,
                type: "cat1",
                date: new Date()
            }
        ])
        //The API request must be awaited as well
        const req_body = Transactions.map((t) => t._id);
        const response = await request(app)
            .delete("/api/transactions")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ _ids: req_body });

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error")
        expect(response.body.error).toBe("Admin: Mismatched role")    
    });
})
