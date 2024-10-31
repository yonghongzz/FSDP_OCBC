const Card = require("../models/card");

const getAllCards = async (req, res) => {
    try {
      const cards = await Card.getAllCards(); 
      res.json(cards);
    } catch (error) { 
      console.error(error);
      res.status(500).send("Error retrieving cards");
    }
};

const getCardById = async (req, res) => {
    const cardId = parseInt(req.params.id); 
    try {
      const card = await Card.getCardById(cardId); 
      if (!card) {
        return res.status(404).send("Card not found"); 
      }
      res.json(card); 
    } catch (error) {
      console.error(error); 
      res.status(500).send("Error retrieving card"); 
    }
};

module.exports = {
    getAllCards,
    getCardById
};