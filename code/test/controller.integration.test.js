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
    test("Returns a message for confirmation and the number of updated transactions", async () => {
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
        //The API request must be awaited as well
        const response = await request(app)
            .patch("/api/categories/food") //Route to call
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`) //Setting cookies in the request
            .send({ type: "health", color: "red" })

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty("message")
        expect(response.body.data).toHaveProperty("count", 2)
    })

    test("Returns a 400 error if the type of the new category is the same as one that exists already and that category is not the requested one", async () => {
        await categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }])

        await User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
        })

        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({ type: "health", color: "green" }) //The passed type is one that already exists and is not the same one in the route

        //The response status must signal a wrong request
        expect(response.status).toBe(400)
        //The response body must contain a field named either "error" or "message" (both names are accepted but at least one must be present)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        //The test passes if the response body contains at least one of the two fields
        expect(errorMessage).toBe(true)
    })

    test("Returns a 400 error if the request body does not contain all the necessary parameters", async () => {
        await User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
        })
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        //The ".send()" block is missing, meaning that the request body will be empty
        //Appending ".send({}) leads to the same scenario, so both options are equivalent"

        expect(response.status).toBe(400)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    })

    test("Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
        await User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
        })
        const response = await request(app)
            .patch("/api/categories/food")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            .send({type: " ", color: " "})

        expect(response.status).toBe(400)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    })

    test("Returns a 401 error if called by a user who is not an Admin", async () => {
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
        const response = await request(app)
            .patch("/api/categories/food")
            //The cookies we set are those of a regular user, which will cause the verifyAuth check to fail
            //Other combinations that can cause the authentication check to fail are also accepted:
            //      - mismatched tokens: .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            //      - empty tokens: .set("Cookie", `accessToken=${testerAccessTokenEmpty}; refreshToken=${testerAccessTokenEmpty}`)
            //      - expired tokens: .set("Cookie", `accessToken=${testerAccessTokenExpired}; refreshToken=${testerAccessTokenExpired}`)
            //      - missing tokens: .set("Cookie", `accessToken=${}; refreshToken=${}`) (not calling ".set()" at all also works)
            //Testing just one authentication failure case is enough, there is NO NEED to check all possible token combination for each function
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
            .send({ type: "food", color: "green" })

        expect(response.status).toBe(401)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    })

    test("Returns a 400 error if the type of category passed as a route parameter does not represent a category in the database", async () => {
        await categories.insertMany([{
            type: "food",
            color: "red"
        }])

        await User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
        })

        const response = await request(app)
            .patch("/api/categories/health")
            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
            
        expect(response.status).toBe(400)
        const errorMessage = response.body.error ? true : response.body.message ? true : false
        expect(errorMessage).toBe(true)
    })
})

describe("deleteCategory", () => {
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
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
    test("Returns all the categories on database", async () => {
        await categories.insertMany([
            { type: "food", color: "red" },
            { type: "health", color: "green"},
            { type: "car", color: "black"},
        ])
        await User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerAccessTokenValid
        })
        
        const response = await request(app)
            .get("/api/categories/")
            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data).toHaveLength(3);
        expect(response.body.data.every(grp => grp.hasOwnProperty('type') && grp.hasOwnProperty('color'))).toBe(true)
    });

    test("Returns error if called by a user who is not authenticated (authType = Simple)", async () => {
        await User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerAccessTokenValid
        })
        
        const response = await request(app)
            .get("/api/categories/")
            .set("Cookie", `accessToken=""; refreshToken=""`)

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error');
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
