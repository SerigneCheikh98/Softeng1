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
    test('Create transaction successfully', async () => {
        // Create a user for testing
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // Create a category for testing
        await categories.create({ type: 'food', color: 'red' });

        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ username: 'tester', amount: 50, type: 'food' });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toEqual({
            username: 'tester',
            amount: 50,
            type: 'food',
            date: expect.any(String),
        });
    });

    // Test case: Missing parameters
    test('Missing parameters', async () => {
        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Some Parameter is Missing');
    });

    // Test case: Empty string parameters
    test('Empty string parameters', async () => {
        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ username: ' ', amount: ' ', type: ' ' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Some Parameter is an Empty String');
    });

    // Test case: Category does not exist
    test('Category does not exist', async () => {
        // Create a user for testing
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });

        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ username: 'tester', amount: 50, type: 'nonexistent' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Category does not exist!');
    });

    // Test case: Mismatched usernames
    test('Mismatched usernames', async () => {
        // Create a user for testing
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // Create a category for testing
        await categories.create({ type: 'food', color: 'red' });

        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ username: 'different', amount: 50, type: 'food' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Wrong Usernames');
    });

    // Test case: User does not exist
    test('User does not exist', async () => {
        //await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });

        // Create a category for testing
        await categories.create({ type: 'food', color: 'red' });

        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ username: 'tester', amount: 50, type: 'food' });
        //tester Cookies are defined but doesn't exists in the db
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'User does not exist!');
    });

    // Test case: Invalid amount
    test('Invalid amount', async () => {
        // Create a user for testing
        await User.create({ username: 'tester', email: 'tester@test.com', password: 'tester' });
        // Create a category for testing
        await categories.create({ type: 'food', color: 'red' });

        const response = await request(app)
            .post('/api/users/tester/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ username: 'tester', amount: 'abc', type: 'food' });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Amount not valid');
    });
    // Test case:Returns 401 error when unauthorized
    test(' Returns 401 error when unauthorized', async () => {
        const response = await request(app)
        .post('/api/users/tester/transactions') 
        .set('Cookie', `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send({ username: 'tester', amount: 50, type: 'food' });
    
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
})

describe("getAllTransactions", () => {
    test('Returns all transactions when you are admin', async () => {
        await categories.create({ type: 'food', color: 'red' });
        await User.insertMany([
            {
                username: 'tester',
                email: 'tester@test.com',
                password: 'tester',
                refreshToken: testerAccessTokenValid,
            },
            {
                username: 'admin',
                email: 'admin@email.com',
                password: 'admin',
                refreshToken: adminAccessTokenValid,
                role: 'Admin',
            },
        ]);
        let trans = await transactions.insertMany([
            { username: 'tester', type: 'food', amount: 20 },
            { username: 'tester', type: 'food', amount: 100 },
            { username: 'admin', type: 'food', amount: 200 },

        ]);

        const response = await request(app)
            .get('/api/transactions')
            .set('Cookie', `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`);

        let ExpectedData = trans.map(v => Object.assign({}, { username: v.username, type: v.type, amount: v.amount, date: v.date.toISOString(), color: "red" }))

        expect(ExpectedData).toEqual(response.body.data);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });
    test('Returns unauthorized error for non-admin', async () => {
        const response = await request(app)
            .get('/api/transactions')
            .set('Cookie', `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', "Admin: Mismatched role");
        expect(response.body).not.toHaveProperty('data');
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
