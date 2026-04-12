const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protected routes - Specific routes FIRST
router.get("/me", authMiddleware, userController.getMe);
router.put("/me", authMiddleware, userController.updateMe);
router.put("/fcm-token", authMiddleware, userController.updateFcmToken);
router.get("/contacts/active", authMiddleware, userController.getActiveBuddies);
router.get("/contacts", authMiddleware, userController.getContacts);
router.post("/contacts/:contactId", authMiddleware, userController.addContact);
router.delete("/contacts/:contactId", authMiddleware, userController.removeContact);
router.put("/location", authMiddleware, userController.updateUserLocation);
router.get("/search", authMiddleware, userController.searchUsers);
router.get("/nearby", authMiddleware, userController.getNearbyUsers);
router.get("/leaderboard", authMiddleware, userController.getLeaderboard);
router.get("/:userId/credibility", authMiddleware, userController.getUserCredibility);


// Public routes - AFTER specific protected routes
router.get("/:id", userController.getUser);

module.exports = router;