const RecurringTransfer = require("../models/recurringtransfer");

// Get all recurring transfers for a user
const getAllRecurringTransfers = async (req, res) => {
    const userId = parseInt(req.params.userId);  // Get user ID from URL
    try {
        const transfers = await RecurringTransfer.getAllRecurringTransfers(userId); 
        console.log(transfers); // Log the fetched data
        res.json(transfers);  // Return the list of recurring transfers in JSON format
    } catch (error) { 
        console.error(error); 
        res.status(500).send("Error retrieving recurring transfers"); 
    }
};

// Get a specific recurring transfer by ID
const getRecurringTransferById = async (req, res) => {
    const transferId = parseInt(req.params.id);  // Get recurring_transfer_id from URL
    try {
        const transfer = await RecurringTransfer.getRecurringTransferById(transferId); 
        if (!transfer) {
            return res.status(404).send("Recurring transfer not found");  // If transfer not found, return 404
        }
        res.json(transfer);  // Return the recurring transfer details
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving recurring transfer");
    }
};

// Create a new recurring transfer
const createRecurringTransfer = async (req, res) => {
    const newTransferData = req.body;  // Get recurring transfer data from request body
    try {
        await RecurringTransfer.createRecurringTransfer(newTransferData);
        res.status(201).send("Recurring transfer created successfully");  // Return success message
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating recurring transfer");
    }
};

// Update a recurring transfer's details
const updateRecurringTransfer = async (req, res) => {
    const transferId = parseInt(req.params.id);  // Get recurring_transfer_id from URL
    const updatedTransferData = req.body;  // Get the updated transfer data from request body
    try {
        await RecurringTransfer.updateRecurringTransfer(transferId, updatedTransferData);
        res.send("Recurring transfer updated successfully");  // Return success message
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating recurring transfer");
    }
};

// Delete a recurring transfer
const deleteRecurringTransfer = async (req, res) => {
    const transferId = parseInt(req.params.id);  // Get recurring_transfer_id from URL
    try {
        await RecurringTransfer.deleteRecurringTransfer(transferId);
        res.status(200).send("Recurring transfer deleted successfully");  // Confirm deletion
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting recurring transfer");
    }
};

module.exports = {
    getAllRecurringTransfers,
    getRecurringTransferById,
    createRecurringTransfer,
    updateRecurringTransfer,
    deleteRecurringTransfer,
};
