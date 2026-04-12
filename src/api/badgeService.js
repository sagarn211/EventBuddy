import API from "./api";

export const getUserBadges = (userId) => {
  return API.get(`/badges/${userId}`);
};

export const assignBadge = (userId, badgeName) => {
  return API.post("/badges/assign", { userId, badgeName });
};
