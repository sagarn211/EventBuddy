const userService = require("../services/user.service");

module.exports.createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getUser = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.params.id;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.params.id;
        const user = await userService.updateProfile(userId, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getMe = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.updateMe = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userService.updateProfile(userId, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.searchUsers = async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: "Search query required" });
        }
        const users = await userService.searchUsers(q, limit ? parseInt(limit) : 10);
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getNearbyUsers = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }
        const users = await userService.getNearByUsers(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseFloat(radius) : 5000
        );
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.updateUserLocation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Latitude and longitude required" });
        }
        const user = await userService.updateUserLocation(userId, lat, lng);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getUserCredibility = async (req, res) => {
    try {
        const userId = req.params.userId;
        const credibility = await userService.getUserCredibility(userId);
        res.status(200).json({ success: true, data: credibility });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getActiveBuddies = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20 } = req.query;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID not found" });
        }

        const buddies = await userService.getActiveBuddies(userId, parseInt(limit));
        res.status(200).json({ success: true, data: buddies });
    } catch (err) {
        console.error("getActiveBuddies error:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getContacts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 100, skip = 0 } = req.query;
        const contacts = await userService.getContacts(userId, parseInt(limit), parseInt(skip));
        res.status(200).json({ success: true, data: contacts });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.addContact = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contactId } = req.params;
        const contact = await userService.addContact(userId, contactId);
        res.status(200).json({ success: true, data: contact });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.removeContact = async (req, res) => {
    try {
        const userId = req.user._id;
        const { contactId } = req.params;
        const contact = await userService.removeContact(userId, contactId);
        res.status(200).json({ success: true, data: contact });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
module.exports.getLeaderboard = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const leaderboard = await userService.getLeaderboard(parseInt(limit));
        res.status(200).json({ success: true, data: leaderboard });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.updateFcmToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fcmToken } = req.body;
        
        if (!fcmToken) {
            return res.status(400).json({ success: false, message: "FCM token required" });
        }
        
        const user = await userService.updateProfile(userId, { fcmToken });
        res.status(200).json({ success: true, data: user, message: "FCM token updated" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
