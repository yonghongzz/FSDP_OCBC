const Account = require("../models/account");

const getAllAccounts = async (req, res) => {
    try {
      const accounts = await Account.getAllAccounts(); 
      res.json(accounts); 
    } catch (error) { 
      console.error(error); 
      res.status(500).send("Error retrieving accounts"); 
    }
};

const getAccountById = async (req, res) => {
    const accountId = parseInt(req.params.id);
    try {
      const account = await Account.getAccountById(accountId); 
      if (!account) {
        return res.status(404).send("Account not found");
      }
      res.json(account); 
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving account");
    }
};

module.exports = {
    getAllAccounts,
    getAccountById
};