const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protected routes
router.post("/", authMiddleware, reviewController.createReview);
router.put("/:reviewId", authMiddleware, reviewController.updateReview);
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);
router.get("/check/:userId", authMiddleware, reviewController.hasReviewed);

// Public routes
router.get("/by/:userId", reviewController.getReviewsBy);
router.get("/:userId/rating", reviewController.getUserRating);
router.get("/:userId", reviewController.getReviews);

module.exports = router;