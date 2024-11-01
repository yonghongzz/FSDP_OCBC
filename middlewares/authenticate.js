const jwt = require("jsonwebtoken");
require('dotenv').config();

function verifyJWT(req, res, next) {
    // get token
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) { // if no token, deny
        return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => { // verify if token is valid
        if (err) {
            return res.status(403).json({ message: "Forbidden" });
        }

        req.user = decoded; // Attach decoded user information to the request object
        next();
    });
}

module.exports = {
    verifyJWT
};