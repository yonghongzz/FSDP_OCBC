const RecurringTransfer = require("../models/recurringtransfer");

const getAllRecurringTransfers = async (req, res) => {
    try {
        const recurringTransfers = await RecurringTransfer.getAllRecurringTransfers();
        res.json(recurringTransfers);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving recurring transfers");
    }
};

const getRecurringTransferById = async (req, res) => {
    const recurringTransferId = parseInt(req.params.id);
    try {
        const recurringTransfer = await RecurringTransfer.getRecurringTransferById(recurringTransferId);
        if (!recurringTransfer) {
            return res.status(404).send("Recurring transfer not found");
        }
        res.json(recurringTransfer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving recurring transfer");
    }
};

const createRecurringTransfer = async (req, res) => {
    const newRecurringTransferData = req.body;

    try {
        const createdRecurringTransfer = await RecurringTransfer.createRecurringTransfer(newRecurringTransferData);
        res.status(201).json(createdRecurringTransfer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating recurring transfer");
    }
};

const updateRecurringTransfer = async (req, res) => {
    const recurringTransferId = parseInt(req.params.id);
    const updatedData = req.body;

    try {
        const existingRecurringTransfer = await RecurringTransfer.getRecurringTransferById(recurringTransferId);
        if (!existingRecurringTransfer) {
            return res.status(404).send("Recurring transfer not found");
        }

        const updatedRecurringTransfer = await RecurringTransfer.updateRecurringTransfer(recurringTransferId, updatedData);
        res.json(updatedRecurringTransfer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating recurring transfer");
    }
};

const deleteRecurringTransfer = async (req, res) => {
    const recurringTransferId = parseInt(req.params.id);

    try {
        const existingRecurringTransfer = await RecurringTransfer.getRecurringTransferById(recurringTransferId);
        if (!existingRecurringTransfer) {
            return res.status(404).send("Recurring transfer not found");
        }

        await RecurringTransfer.deleteRecurringTransfer(recurringTransferId);
        res.status(204).send(); // No Content
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
    deleteRecurringTransfer
};
