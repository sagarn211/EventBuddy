const badgeService = require("../services/badge.service");

module.exports.assignBadge = async (req, res) => {
    try {
        const { userId, badgeName } = req.body;
        const result = await badgeService.assignBadge(userId, badgeName);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getBadges = async (req, res) => {
    try {
        const result = await badgeService.getBadges(req.params.userId);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
