const AccTransaction = require("../models/acctransaction");

const getAllAccTransactions = async (req, res) => {
    try {
      const acctransactions = await AccTransaction.getAllAccTransactions();
      res.json(acctransactions);
    } catch (error) { 
      console.error(error);
      res.status(500).send("Error retrieving transactions");
    }
};

const getAccTransactionById = async (req, res) => {
    const acctransactionId = parseInt(req.params.id);
    try {
      const acctransaction = await AccTransaction.getAccTransactionById(acctransactionId);
      if (!acctransaction) {
        return res.status(404).send("Transaction not found");
      }
      res.json(acctransaction);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving transaction");
    }
};

const createAccTransaction = async (req, res) => {
    const newAccTransaction = req.body;
    try {
      const createdAccTransaction = await AccTransaction.createAccTransaction(newAccTransaction);
      res.status(201).json(createdAccTransaction);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating transaction");
    }
};

module.exports = {
    getAllAccTransactions,
    getAccTransactionById,
    createAccTransaction
};