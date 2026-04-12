const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protected routes
router.post("/", authMiddleware, notificationController.sendNotification);
router.get("/count", authMiddleware, notificationController.getNotificationCount);
router.get("/", authMiddleware, notificationController.getNotifications);
router.post("/:notificationId/read", authMiddleware, notificationController.markAsRead);
router.put("/mark-all-read", authMiddleware, notificationController.markAllAsRead);
router.delete("/:notificationId", authMiddleware, notificationController.deleteNotification);
router.delete("/all", authMiddleware, notificationController.deleteAllNotifications);

module.exports = router;