const authService = require("../services/auth.service");

module.exports.sendOtp = async (req, res) => {
    try {
        const result = await authService.sendOtp(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
};

module.exports.verifyOtp = async (req, res) => {
    try {
        const result = await authService.verifyOtp(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.firebaseLogin = async (req, res) => {
    try {
        const result = await authService.firebaseLogin(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};