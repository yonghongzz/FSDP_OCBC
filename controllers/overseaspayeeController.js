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

// Update an overseas payee's details
const updateOverseasPayee = async (req, res) => {
    const payeeId = parseInt(req.params.id);  // Get payee ID from URL
    const updatedPayeeData = req.body;  // Get the updated payee data from request body
    try {
        const updatedPayee = await OverseasPayee.updatePayee(payeeId, updatedPayeeData);
        res.json(updatedPayee);  // Return the updated payee
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating overseas payee");
    }
};

// Pin or unpin an overseas payee
const toggleOverseasPayeePin = async (req, res) => {
    const payeeId = parseInt(req.params.id);  // Get payee ID from URL
    const { is_pinned } = req.body;  // Get the new pin status from request body
    try {
        const updatedPayee = await OverseasPayee.togglePin(payeeId, is_pinned);
        res.json(updatedPayee);  // Return the updated payee after pinning/unpinning
    } catch (error) {
        console.error(error);
        res.status(500).send("Error toggling overseas payee pin status");
    }
};

module.exports = {
    getAllOverseasPayees,
    getOverseasPayeeById,
    createOverseasPayee,
    updateOverseasPayee,
    toggleOverseasPayeePin
};