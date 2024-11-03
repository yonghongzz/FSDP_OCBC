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

const updateTransactionLimit = async (req, res) => {
  const id = parseInt(req.params.id);
  const newLimitData = req.body;

  try {
    //console.log('Request account:', req.account);

    const account = await Account.getAccountById(id);
    if (!account) {
        return res.status(404).send("Account not found");
    }

    /*
    if (account.user_id != req.account.user_id) {
      return res.status(403).json({ message: "You are not authorized to update this account" });
    }
    */

    const updatedAccount = await Account.updateTransactionLimit(id, newLimitData);
    if (!updatedAccount) {
      return res.status(404).send("Account not found");
    }
    res.json(updatedAccount);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating account");
  }
};

module.exports = {
    getAllAccounts,
    getAccountById,
    updateTransactionLimit
};