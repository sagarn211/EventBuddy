import API from "./api";

export const getMe = () => {
  return API.get("/users/me");
};

export const updateProfile = (userData) => {
  return API.put("/users/me", userData);
};

export const getUserById = (userId) => {
  return API.get(`/users/${userId}`);
};

export const searchUsers = (query, limit = 10) => {
  return API.get(`/users/search?q=${query}&limit=${limit}`);
};

export const getNearbyUsers = (lat, lng, radius = 5000) => {
  return API.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
};

export const updateUserLocation = (lat, lng) => {
  return API.put("/users/location", { lat, lng });
};

export const getUserCredibility = (userId) => {
  return API.get(`/users/${userId}/credibility`);
};

// Get active buddies/contacts
export const getActiveBuddies = (limit = 20) => {
  return API.get(`/users/contacts/active?limit=${limit}`);
};

// Get all contacts for the user
export const getContacts = (limit = 100, skip = 0) => {
  return API.get(`/users/contacts?limit=${limit}&skip=${skip}`);
};

// Add a buddy/contact
export const addContact = (userId) => {
  return API.post(`/users/contacts/${userId}`);
};

// Remove a buddy/contact
export const removeContact = (userId) => {
  return API.delete(`/users/contacts/${userId}`);
};

// Get user leaderboard by badge count
export const getLeaderboard = (limit = 10) => {
  return API.get(`/users/leaderboard?limit=${limit}`);
};

// Alias for searchUsers
export const search = (query, limit = 10) => {
  return searchUsers(query, limit);
};

