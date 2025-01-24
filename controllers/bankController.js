const bank = require('../models/banklocation');

const getAllBanks = async (req, res) => {
    try {
        const banks = await bank.getAllBankLocations();
        res.json(banks);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving branch locations");
    }
}

module.exports = {
    getAllBanks
};