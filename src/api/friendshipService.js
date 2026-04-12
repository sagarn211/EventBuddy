import API from "./api";

/**
 * Send a buddy request to another user
 * @param {string} userId ID of the recipient
 */
export const sendBuddyRequest = async (userId) => {
    return API.post(`/friends/request/${userId}`);
};

/**
 * Accept a pending buddy request
 * @param {string} requestId ID of the friendship record
 */
export const acceptBuddyRequest = async (requestId) => {
    return API.patch(`/friends/accept/${requestId}`);
};

/**
 * Get all accepted buddies
 */
export const getBuddies = async () => {
    return API.get("/friends");
};

/**
 * Get pending buddy requests sent to the current user
 */
export const getPendingRequests = async () => {
    return API.get("/friends/pending");
};
