import API from "./api";

// Get all notifications for the current user
export const getNotifications = (limit = 50, skip = 0) => {
  return API.get(`/notifications?limit=${limit}&skip=${skip}`);
};

// Get notification count (unread)
export const getNotificationCount = () => {
  return API.get("/notifications/count");
};

// Mark notification as read
export const markAsRead = (id) => {
  return API.post(`/notifications/${id}/read`);
};

// Mark all notifications as read
export const markAllNotificationsAsRead = () => {
  return API.put("/notifications/mark-all-read");
};

// Delete a notification
export const deleteNotification = (notificationId) => {
  return API.delete(`/notifications/${notificationId}`);
};

// Delete all notifications
export const deleteAllNotifications = () => {
  return API.delete("/notifications/all");
};

// Send notification (admin/test)
export const sendNotification = (notificationData) => {
  return API.post("/notifications", notificationData);
};
