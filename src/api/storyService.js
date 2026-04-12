import API from "./api";

/**
 * Fetch all stories from the global backend feed
 * @returns {Promise} List of story objects
 */
export const getGlobalStories = async () => {
    return API.get("/stories");
};

/**
 * Save a story to the backend database with media uploaded to ImageKit
 * @param {object} storyData The story payload (text, media, type, etc.)
 * @returns {Promise} The created story response
 */
export const saveStoryToBackend = async (storyData) => {
    return API.post("/stories", storyData);
};

/**
 * Delete a story from the backend
 * @param {string} storyId MongoDB ID of the story
 * @returns {Promise}
 */
export const deleteStoryFromBackend = async (storyId) => {
    return API.delete(`/stories/${storyId}`);
};
