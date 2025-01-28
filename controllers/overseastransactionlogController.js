const OverseasTransactionLog = require("../models/overseastransactionlog");

// Get all overseas transaction logs for a transaction
const getAllOverseasTransactionLogs = async (req, res) => {
    const transactionId = parseInt(req.params.transactionId);  // Get transaction ID from URL
    try {
        const logs = await OverseasTransactionLog.getAllLogs(transactionId);
        res.json(logs);  // Return the list of logs in JSON format
    } catch (error) { 
        console.error(error); 
        res.status(500).send("Error retrieving overseas transaction logs"); 
    }
};

// Get a specific overseas transaction log by ID
const getOverseasTransactionLogById = async (req, res) => {
    const logId = parseInt(req.params.id);  // Get log ID from URL
    try {
        const log = await OverseasTransactionLog.getLogById(logId); 
        if (!log) {
            return res.status(404).send("OverseaTransactionLog not found");  // If log not found, return 404
        }
        res.json(log);  // Return the log details
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving overseas transaction log");
    }
};

// Create a new overseas transaction log
const createOverseasTransactionLog = async (req, res) => {
    const newLogData = req.body;  // Get log data from request body
    try {
        const newLog = await OverseasTransactionLog.createTransactionLog(newLogData);
        res.status(201).json(newLog);  // Return the newly created log
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating overseas transaction log");
    }
};

module.exports = {
    getAllOverseasTransactionLogs,
    getOverseasTransactionLogById,
    createOverseasTransactionLog
};
