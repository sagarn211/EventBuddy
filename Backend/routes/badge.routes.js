const express = require("express");
const router = express.Router();

const badgeController = require("../controllers/badge.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protected
router.post("/assign", authMiddleware, badgeController.assignBadge);
router.get("/:userId", authMiddleware, badgeController.getBadges);

module.exports = router;