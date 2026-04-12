const notificationService = require("../services/notification.service");

module.exports.sendNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { message, title, data } = req.body;
        const result = await notificationService.sendNotification(userId, message, title, data);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit, skip } = req.query;
        const result = await notificationService.getNotifications(
            userId,
            limit ? parseInt(limit) : 50,
            skip ? parseInt(skip) : 0
        );
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getNotificationCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await notificationService.getNotificationCount(userId);
        res.status(200).json({ success: true, data: count });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        const result = await notificationService.markAsRead(notificationId);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await notificationService.markAllAsRead(userId);
        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.notificationId;
        await notificationService.deleteNotification(notificationId);
        res.status(200).json({ success: true, message: "Notification deleted" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        await notificationService.deleteAllNotifications(userId);
        res.status(200).json({ success: true, message: "All notifications deleted" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
