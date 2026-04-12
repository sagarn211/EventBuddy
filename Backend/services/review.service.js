const Review = require('../models/review.model');
const User = require('../models/user.model');
const notificationService = require("./notification.service");
const mongoose = require('mongoose');

//Add review
module.exports.createReview = async ({ toUser, rating, comment, reviewer, planId }) => {
    if(!toUser || !rating || !reviewer) {
        throw new Error("Missing required fields");
    }

    if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    // Check if reviewer already reviewed this user
    const existingReview = await Review.findOne({ toUser, reviewer });
    if (existingReview) {
        throw new Error("You can only leave one review per user");
    }

    const review = await Review.create({
        toUser,
        rating,
        comment,
        reviewer,
        planId
    });

    // Update user review count
    await User.findByIdAndUpdate(toUser, { $inc: { reviewsCount: 1 } });

    //Notify User
    await notificationService.notifyNewReview({
        vendor: toUser,
        message: `New ${rating}-star review from member`,
        reviewId: review._id
    });

    return await review.populate('reviewer', 'name avatar phone');
};

//Get reviews of user
module.exports.getReviews = async (userId, limit = 20, skip = 0) => {
    return await Review.find({ toUser: userId })
        .populate('reviewer', 'name avatar phone')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

//Get reviews written by a user
module.exports.getReviewsBy = async (userId, limit = 20, skip = 0) => {
    return await Review.find({ reviewer: userId })
        .populate('toUser', 'name avatar phone')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

//Get average rating for user
module.exports.getUserRating = async (userId) => {
    const reviews = await Review.aggregate([
        { $match: { toUser: new mongoose.Types.ObjectId(userId) } },
        { $group: {
            _id: "$toUser",
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            fiveStarCount: {
                $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] }
            },
            fourStarCount: {
                $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] }
            },
            threeStarCount: {
                $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] }
            },
            twoStarCount: {
                $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] }
            },
            oneStarCount: {
                $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] }
            }
        }}
    ]);

    if (reviews.length === 0) {
        return { 
            averageRating: 0, 
            totalReviews: 0,
            fiveStarCount: 0,
            fourStarCount: 0,
            threeStarCount: 0,
            twoStarCount: 0,
            oneStarCount: 0
        };
    }

    return reviews[0];
};

//Update review
module.exports.updateReview = async (reviewId, reviewerId, data) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw new Error("Review not found");
    }
    if (review.reviewer.toString() !== reviewerId.toString()) {
        throw new Error("Unauthorized to update this review");
    }

    if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new Error("Rating must be between 1 and 5");
    }

    const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        { 
            rating: data.rating || review.rating, 
            comment: data.comment || review.comment,
            editedAt: new Date()
        },
        { new: true }
    ).populate('reviewer', 'name avatar phone');

    return updatedReview;
};

//Delete review
module.exports.deleteReview = async (reviewId, reviewerId) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw new Error("Review not found");
    }
    if (review.reviewer.toString() !== reviewerId.toString()) {
        throw new Error("Unauthorized to delete this review");
    }

    await Review.deleteOne({ _id: reviewId });
    
    // Decrement user review count
    await User.findByIdAndUpdate(review.toUser, { $inc: { reviewsCount: -1 } });
    
    return { success: true };
};

// Check if user reviewed another user
module.exports.hasReviewed = async (userId, toUserId) => {
    const review = await Review.findOne({ reviewer: userId, toUser: toUserId });
    return !!review;
};
