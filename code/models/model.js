import mongoose, { Schema } from "mongoose";

const categories_model = new Schema({
    type: {
        type: String,
        required: true,
        default: "investment"
    },
    color: {
        type: String,
        required: true,
        default: "#fcbe44"
    }
    
});

const transaction_model = new Schema({
    name: {
        type: String,
        default: "Anonymous"
    },
    type: {
        type: String,
        default: "investment"
    },
    amount: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const categories = mongoose.model("categories", categories_model);
const transactions = mongoose.model("transactions", transaction_model);

export { categories, transactions }

