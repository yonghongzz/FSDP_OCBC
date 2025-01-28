const ATM = require('../models/atmlocation');

const getAllATMs = async (req, res) => {
    try {
        const atms = await ATM.getAllAtmLocations();
        res.json(atms);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving ATM locations");
    }
}

module.exports = {
    getAllATMs
};