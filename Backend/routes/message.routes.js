const express = require("express");
const router = express.Router();

const messageController = require("../controllers/message.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// All protected routes
router.post("/", authMiddleware, messageController.sendMessage);
router.get("/chats", authMiddleware, messageController.getChats);

// Direct messaging routes (must be before routes with parameters)
router.get("/conversations/direct", authMiddleware, messageController.getDirectConversations);
router.get("/direct/:recipient", authMiddleware, messageController.getDirectMessages);
router.post("/direct/:recipient", authMiddleware, messageController.sendDirectMessage);

// Plan message routes
router.get("/:planId", authMiddleware, messageController.getMessages);
router.get("/:planId/search", authMiddleware, messageController.searchMessages);
router.put("/:messageId/read", authMiddleware, messageController.markAsRead);
router.put("/:planId/read-all", authMiddleware, messageController.markPlanAsRead);
router.put("/:messageId", authMiddleware, messageController.editMessage);
router.delete("/:messageId", authMiddleware, messageController.deleteMessage);

module.exports = router;