import API from "./api";

// Send a message
export const sendMessage = (messageData) => {
  return API.post("/messages", messageData);
};

// Get messages for a specific plan/chat
export const getMessages = (planId, limit = 50, skip = 0) => {
  return API.get(`/messages/${planId}?limit=${limit}&skip=${skip}`);
};

// Get all chats for the user
export const getChats = () => {
  return API.get("/messages/chats");
};

// Mark message as read
export const markAsRead = (messageId) => {
  return API.put(`/messages/${messageId}/read`);
};

// Mark all messages in a plan as read
export const markPlanAsRead = (planId) => {
  return API.put(`/messages/${planId}/read-all`);
};

// Delete a message
export const deleteMessage = (messageId) => {
  return API.delete(`/messages/${messageId}`);
};

// Edit a message
export const editMessage = (messageId, text) => {
  return API.put(`/messages/${messageId}`, { text });
};

// Search messages in a plan
export const searchMessages = (planId, query) => {
  return API.get(`/messages/${planId}/search?q=${query}`);
};

// Get or start direct message conversation with a user
export const getDirectMessages = (userId, limit = 50, skip = 0) => {
  return API.get(`/messages/direct/${userId}?limit=${limit}&skip=${skip}`);
};

// Send direct message to a user
export const sendDirectMessage = (userId, text) => {
  return API.post(`/messages/direct/${userId}`, { text });
};

// Get all direct conversations (buddies list)
export const getDirectConversations = (limit = 20, skip = 0) => {
  return API.get(`/messages/conversations/direct?limit=${limit}&skip=${skip}`);
};
