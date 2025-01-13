const Biometric = require("../models/biometric");
const bcrypt = require("bcryptjs");


const createPasskey = async (req, res) => {
    const passkey = req.body;
    try {
      const createdPasskey = await Biometric.createPasskey(passkey);
      res.status(201).json(createdPasskey);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating passkey");
    }
};

const getPasskey = async(req,res)=>{
    const userId = req.query.userId;
    try{
        const passkey = await Biometric.getPasskey(userId);
        res.status(201).json(passkey);
    }catch(error){
        console.error(error);
        res.status(500).send("Error getting passkey");
    }
}


module.exports = {
    createPasskey,
    getPasskey,
};