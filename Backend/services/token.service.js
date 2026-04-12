const jwt = require("jsonwebtoken");

const generateAuthToken = (userId) => {
    return jwt.sign(
        {_id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

module.exports.generateAuthToken = generateAuthToken;
// Backward-compatible alias
module.exports.generateToken = generateAuthToken;
