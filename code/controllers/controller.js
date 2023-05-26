import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (adminAuth.authorized) {
            //Admin auth successful
            const { type, color } = req.body;
            const new_categories = new categories({ type, color });
            new_categories.save()
                .then(data => res.status(200).json({ data: { type: data.type, color: data.color } }))
                .catch(err => { res.status(400).json({ message: "Category already exist!" }) }) //No need to crash the server
        } else {
            res.status(401).json({ error: adminAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 400 returned if the specified category does not exist
    - error 400 is returned if new parameters have invalid values
 */
export const updateCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (adminAuth.authorized) {
            //Admin auth successful
            // if type or color are undefined or only spaces, consider them as invalid values
            if (!req.body.type || !req.body.color || req.body.type.trim().length === 0 || req.body.color.trim().length === 0) {
                res.status(400).json({ message: 'Invalid Values.' });
            } else {
                const data = await categories.findOneAndUpdate({ type: req.params.type }, { $set: { type: req.body.type, color: req.body.color } });
                if (data === null) {
                    res.status(400).json({ message: 'This category does not exist.' });
                } else {
                    // change all related transactions
                    const updated_transactions = await transactions.updateMany({ type: req.params.type }, { type: req.body.type });
                    res.status(200).json({ data: { count: updated_transactions.modifiedCount }, message: 'Category Edited With Success' });
                }
            }
        } else {
            res.status(401).json({ error: adminAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 400 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (adminAuth.authorized) {
            //Admin auth successful
            for (let type of req.body.types) {
                //find category 
                const el_finded = await categories.findOne({ type: type });
                if (el_finded === null) {
                    return res.status(400).json({ message: "One or more Categories do not exists" });
                }
            }
// MOTO, AUTO, VESPA       MOTO  => AUTO,VESPA   3>1  [ && type !== firstCat.type]
// MOTO,AUTO,VESPA  MOTO,AUTO, => VESPA
// MOTO,AUTO,VESPA  MOTO,AUTO,VESPA => MOTO
//MOTO,AUTO,VESPA  MOTO,AUTO,VESPA,gigi => MOTO 

            let count = 0;
            for (let type of req.body.types) {

                let numbCateg = await categories.count();
                if(numbCateg === 1){
                    return res.status(400).json({ error: "You can't delete all categories! Now you have just one category saved" })        
                }
                let firstCat = await categories.findOne({}, null, { sort: { _id: 1 } })//assigning of default
                

                if(numbCateg > req.body.types.length  ){
                    //case:  MOTO,AUTO,VESPA  MOTO,AUTO => rimane VESPA

                    let prova=await categories.findOne({ type: { $nin: req.body.types } }, null, { sort: { _id: 1 } });
                    console.log("Categorie non in body "+prova+"vaffanculo")
                    
                    firstCat = await categories.findOne({ type: { $nin: req.body.types } }, null, { sort: { _id: 1 } });
                    console.log("firstCat1"+firstCat);
                    const n_el_deleted = await categories.deleteOne({ type: type });
                    const updated_transactions = await transactions.updateMany({ type: type }, { type: firstCat.type });
                    count += updated_transactions.modifiedCount;
                }else if( numbCateg <= req.body.types.length && type !== firstCat.type ){
                    
                    // case: MOTO,AUTO,VESPA   MOTO,AUTO,VESPA => rimane MOTO
                    console.log("firstCat2"+firstCat);
                    const n_el_deleted = await categories.deleteOne({ type: type });
                    const updated_transactions = await transactions.updateMany({ type: type }, { type: firstCat.type });
                    count += updated_transactions.modifiedCount;
                } 

                

            }     

            res.status(200).json({ data: { count: count }, message: 'Category Deleted With Success, ' + count.toString() + ' transactions updated' });
            
            
            //transazioni solo dell'utente loggato
            //res.status(200).json({ message: 'Categories Deleted With Success', count: updated_transactions.nModified });
        } else {
            res.status(401).json({ error: adminAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {
        const user = await User.findOne({ refreshToken: req.cookies.refreshToken });
        if (user === null) {
            return res.status(401).json({ error: "Invalid Cookies" });
        }
        const userAuth = verifyAuth(req, res, { authType: "User", username: user.username })
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (userAuth.authorized || adminAuth.authorized) {
            //User or Admin auth successful
            let data = await categories.find({})
            let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))
            return res.status(200).json({ data: filter, message: "all categories returned" })
        } else {
            res.status(401).json({ error: adminAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 400 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {
        
        if (req.params.username !== req.body.username ) {
            return res.status(400).json({ error: "Wrong Usernames" });
        }
        const userAuth = verifyAuth(req, res, {authType: "User", username: req.params.username})
        console.log(userAuth.authorized)
        if (userAuth.authorized) {
            //User or Admin auth successful
            const { username, amount, type } = req.body;
            //check category type
            const category = await categories.findOne({ type: type })
            if (!category) {
                return res.status(400).json({ message: "Category does not exist!" })
            }
            // create transaction
            const new_transactions = new transactions({ username, amount, type, date: new Date() });//date is also taken as default in the costructor but we insert it anyway
            new_transactions.save()
                .then(data => res.status(200).json({ data: { username: data.username, amount: data.amount, type: data.type, date: data.date }, message: "Transaction Created" }))
                .catch(err => { res.status(400).json({ error: err.message }) })
        } else {
            res.status(401).json({ error: userAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (adminAuth.authorized) {
            //Admin auth successful
            /**
             * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
             */
            transactions.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                let data = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                res.status(200).json({ data: data });
            }).catch(err => { res.status(400).json({ error: err.message }) })
        } else {
            return res.status(401).json({ error: adminAuth.cause})
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 400 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
    try {
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (userAuth.authorized || adminAuth.authorized) {
            //User or Admin auth successful
            let filterByDate;
            let filterByAmount;
            if (adminAuth.authorized) {
                //admin (not filtering, so all true to match in the query)
                filterByDate = {};
                filterByAmount = {};
            } else {
                //users (filtering, so apply all the filters)
                filterByDate = handleDateFilterParams(req.query);
                filterByAmount = handleAmountFilterParams(req.query);
            }
            //find all transactions then 
            let allTransactions = [];
            transactions.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $match: { $and: [filterByDate, filterByAmount] } },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                allTransactions = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                //Distinction between route accessed by Admins or Regular users for functions that can be called by both
                //and different behaviors and access rights
                res.status(200).json(allTransactions.filter(tr => tr.username === req.params.username))
            }).catch(error => { res.status(400).json({ error: error.message }) })
        } else {
            return res.status(401).json({ error: (adminAuth.authorized) ? adminAuth.cause : userAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 400 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    try {
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (userAuth.authorized || adminAuth.authorized) {
            //User or Admin auth successful
            let allTransactions = [];
            transactions.aggregate([
                {
                    $lookup: {
                        from: "categories",
                        localField: "type",
                        foreignField: "type",
                        as: "categories_info"
                    }
                },
                { $unwind: "$categories_info" }
            ]).then((result) => {
                allTransactions = result.map(v => Object.assign({}, { username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
                // return the transactions
                res.status(200).json(allTransactions.filter(tr => (tr.username === req.params.username && tr.type === req.params.category)))
            }).catch(error => { res.status(400).json({ message: error }) })
        } else {
            return res.status(401).json({ error: (adminAuth.authorized) ? adminAuth.cause : userAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 400 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    try {
        const user = await User.findOne({refreshToken: req.cookies.refreshToken});
        if (user === null) {
            return res.status(401).json({ error: "Invalid Cookies" });
        }
        const userAuth = verifyAuth(req, res, { authType: "User", username: user.username })
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (userAuth.authorized || adminAuth.authorized) {
            let allTransactions = [];
            let group = await Group.findOne({name: req.params.name});
            if (group === null) {
                return res.status(400).json({ error: "Group does not exist." });
            }
            transactions.aggregate([
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
                        'group.name': req.params.name
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
            ]).then((result) => {
                allTransactions = result.map(v => Object.assign({}, { username: v.user.username, type: v.category.type, amount: v.amount, date: v.date, color: v.category.color }))
                // return the transactions
                res.status(200).json(allTransactions);
            }).catch(error => { res.status(400).json({ message: error.message }) });
        } else {
            return res.status(401).json({ error: (adminAuth.authorized) ? adminAuth.cause : userAuth.cause })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 400 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {
        const user = await User.findOne({refreshToken: req.cookies.refreshToken});
        if (user === null) {
            return res.status(401).json({ error: "Invalid Cookies" });
        }
        const userAuth = verifyAuth(req, res, { authType: "User", username: user.username })
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (userAuth.authorized || adminAuth.authorized) {
            let allTransactions = [];
            let group = await Group.findOne({name: req.params.name});
            if (group === null) {
                return res.status(400).json({ error: "Group does not exist." });
            }
            let category = await categories.findOne({type: req.params.category});
            if (category === null) {
                return res.status(400).json({ error: "Category does not exist." });               
            }
            transactions.aggregate([
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
                        'group.name': req.params.name,
                        'category.type' : req.params.category
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
            ]).then((result) => {
                allTransactions = result.map(v => Object.assign({}, { username: v.user.username, type: v.category.type, amount: v.amount, date: v.date, color: v.category.color }))
                // return the transactions
                res.status(200).json(allTransactions);
            }).catch(error => { res.status(400).json({ message: error.message }) });
        } else {
            return res.status(401).json({ error: (adminAuth.authorized) ? adminAuth.cause : userAuth.cause })
        }
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 400 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {
        const userAuth = verifyAuth(req, res, { authType: "User", username: req.params.username })
        if (userAuth.authorized) {
            //User auth successful
            let transaction = await transactions.findOne({ _id: req.body._id });
            if (transaction.username !== req.params.username) {
                return res.status(400).json({ error: "Transaction belongs to another User, you cannot delete it." });
            }
            let data = await transactions.deleteOne({ _id: req.body._id });
            if (data.deletedCount === 1)
                return res.status(200).json({ message: "Transaction deleted successfully" });
            else
                return res.status(400).json({ error: "Transaction doesn't exist" });
        } else {
            const adminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (adminAuth.authorized) {
                //Admin auth successful
                let data = await transactions.deleteOne({ _id: req.body._id });
                if (data.deletedCount === 1)
                    return res.status(200).json({ message: "Transaction deleted successfully" });
                else
                    return res.status(400).json({ error: "Transaction doesn't exist" });
            } else {
                res.status(401).json({ error: adminAuth.cause })
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 400 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
    try {
        const adminAuth = verifyAuth(req, res, { authType: "Admin" })
        if (adminAuth.authorized) {
            //Admin auth successful
            for (let id of req.body._ids) {
                const el_finded = await transactions.findOne({ _id: id });
                if (el_finded === null)
                    return res.status(400).json({ data: {}, message: "One or more ids does not have a corresponding transaction" });
            }
            for (let id of req.body._ids) {
                const n_el_deleted = await transactions.deleteOne({ _id: id });
            }
            res.status(200).json({ data: {}, message: "Transactions deleted successfully" });
        } else {
            res.status(401).json({ error: adminAuth.cause })
        }
      } catch (error) {
        res.status(500).json({ error: error.message })
      }
}
