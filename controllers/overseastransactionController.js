const OverseasTransaction = require("../models/overseastransaction");

// Get all overseas transactions for a user
const getAllOverseasTransactions = async (req, res) => {
    const userId = parseInt(req.params.userId);  // Get user ID from URL
    try {
        const transactions = await OverseasTransaction.getAllTransactions(userId);
        res.json(transactions);  // Return the list of transactions in JSON format
    } catch (error) { 
        console.error(error); 
        res.status(500).send("Error retrieving overseas transactions"); 
    }
};

// Get an overseas transaction by ID
const getOverseasTransactionById = async (req, res) => {
    const transactionId = parseInt(req.params.id);  // Get transaction ID from URL
    try {
        const transaction = await OverseasTransaction.getTransactionById(transactionId); 
        if (!transaction) {
            return res.status(404).send("OverseaTransaction not found");  // If transaction not found, return 404
        }
        res.json(transaction);  // Return the transaction details
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving overseas transaction");
    }
};

// Create a new overseas transaction
const createOverseasTransaction = async (req, res) => {
    const newTransactionData = req.body;  // Get transaction data from request body
    try {
        const newTransaction = await OverseasTransaction.createTransaction(newTransactionData);
        res.status(201).json(newTransaction);  // Return the newly created transaction
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating overseas transaction");
    }
};

// Modify this function to accept a month filter
const getTransactionsByMonth = async (req, res) => {
    const userId = parseInt(req.params.userId);
    const month = req.params.month;  // Format: YYYY-MM

    try {
        const transactions = await OverseasTransaction.getTransactionsByMonth(userId, month);
        res.json(transactions);  // Return the filtered transactions
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving overseas transactions for the month");
    }
};

module.exports = {
    getAllOverseasTransactions,
    getOverseasTransactionById,
    createOverseasTransaction,
    getTransactionsByMonth
};
