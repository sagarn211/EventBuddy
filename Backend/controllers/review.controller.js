const reviewService = require("../services/review.service");

module.exports.createReview = async (req, res) => {
    try {
        const reviewerId = req.user._id;
        const review = await reviewService.createReview({ ...req.body, reviewer: reviewerId });
        res.status(201).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getReviews = async (req, res) => {
    try {
        const { limit, skip } = req.query;
        const reviews = await reviewService.getReviews(
            req.params.userId,
            limit ? parseInt(limit) : 20,
            skip ? parseInt(skip) : 0
        );
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getReviewsBy = async (req, res) => {
    try {
        const { limit, skip } = req.query;
        const reviews = await reviewService.getReviewsBy(
            req.params.userId,
            limit ? parseInt(limit) : 20,
            skip ? parseInt(skip) : 0
        );
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.getUserRating = async (req, res) => {
    try {
        const rating = await reviewService.getUserRating(req.params.userId);
        res.status(200).json({ success: true, data: rating });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.updateReview = async (req, res) => {
    try {
        const reviewerId = req.user._id;
        const review = await reviewService.updateReview(req.params.reviewId, reviewerId, req.body);
        res.status(200).json({ success: true, data: review });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.deleteReview = async (req, res) => {
    try {
        const reviewerId = req.user._id;
        const result = await reviewService.deleteReview(req.params.reviewId, reviewerId);
        res.status(200).json({ success: true, message: "Review deleted" });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

module.exports.hasReviewed = async (req, res) => {
    try {
        const reviewerId = req.user._id;
        const hasReviewed = await reviewService.hasReviewed(reviewerId, req.params.userId);
        res.status(200).json({ success: true, data: { hasReviewed } });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};