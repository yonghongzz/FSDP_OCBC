const OverseasPayee = require("../models/overseaspayee");

// Get all overseas payees for a user
const getAllOverseasPayees = async (req, res) => {
    const userId = parseInt(req.params.userId);  // Get user ID from URL
    try {
        const payees = await OverseasPayee.getAllPayees(userId); 
        res.json(payees);  // Return the list of payees in JSON format
    } catch (error) { 
        console.error(error); 
        res.status(500).send("Error retrieving overseas payees"); 
    }
};

// Get an overseas payee by ID
const getOverseasPayeeById = async (req, res) => {
    const payeeId = parseInt(req.params.id);  // Get payee ID from URL
    try {
        const payee = await OverseasPayee.getPayeeById(payeeId); 
        if (!payee) {
            return res.status(404).send("OverseaPayee not found");  // If payee not found, return 404
        }
        res.json(payee);  // Return the payee details
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving overseas payee");
    }
};

// Create a new overseas payee
const createOverseasPayee = async (req, res) => {
    const newPayeeData = req.body;  // Get payee data from request body
    try {
        const newPayee = await OverseasPayee.createPayee(newPayeeData);
        res.status(201).json(newPayee);  // Return the newly created payee
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating overseas payee");
    }
};

module.exports = {
    getAllOverseasPayees,
    getOverseasPayeeById,
    createOverseasPayee
};
