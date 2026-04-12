const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

module.exports = async (req, res, next) => {
    try {
        let token;

        // Get token from header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            const parts = req.headers.authorization.split(" ");
            if (parts.length === 2 && parts[1]) {
                token = parts[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Server misconfiguration",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request
        req.user = await userModel.findById(decoded._id).select("-password");

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        return next();
    } catch (error) {
        if (error && error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};
