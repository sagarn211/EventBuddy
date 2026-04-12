import API from "./api";

// Create a review/rating for a user
export const createReview = (reviewData) => {
  return API.post("/reviews", reviewData);
};

// Get reviews for a specific user
export const getUserReviews = (userId, limit = 20, skip = 0) => {
  return API.get(`/reviews/${userId}?limit=${limit}&skip=${skip}`);
};

// Get reviews written by a user
export const getReviewsBy = (userId, limit = 20, skip = 0) => {
  return API.get(`/reviews/by/${userId}?limit=${limit}&skip=${skip}`);
};

// Get user's average rating and details
export const getUserRating = (userId) => {
  return API.get(`/reviews/${userId}/rating`);
};

// Update a review
export const updateReview = (reviewId, reviewData) => {
  return API.put(`/reviews/${reviewId}`, reviewData);
};

// Delete a review
export const deleteReview = (reviewId) => {
  return API.delete(`/reviews/${reviewId}`);
};

// Check if user has reviewed another user
export const hasReviewed = (userId) => {
  return API.get(`/reviews/check/${userId}`);
};
