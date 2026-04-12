const notificationModel = require("../models/notification.model");
const userModel = require("../models/user.model");
const { getIO } = require("./socket.service");
const firebaseService = require("./firebase.service");

//Send notification (in-app via socket + system push via FCM)
module.exports.sendNotification = async (userId, message, title = "EventBuddy", data = {}) => {
    const notification = await notificationModel.create({
        user: userId,
        title,
        message,
        data,
        isRead: false
    });

    // 1. Real-time in-app notification via Socket.IO
    try {
        const io = getIO();
        io.to(`user:${userId.toString()}`).emit("notification", notification);
    } catch (err) {
        console.log("[NOTIFY] Socket not initialized, skipping real-time emit.");
    }

    // 2. System push notification via Firebase Cloud Messaging
    try {
        const recipient = await userModel.findById(userId).select("fcmToken").lean();
        if (recipient && recipient.fcmToken) {
            // FCM data payload requires all values to be strings
            const stringData = Object.fromEntries(
                Object.entries({
                    ...data,
                    notificationId: notification._id.toString(),
                    type: data.type || "general",
                }).map(([k, v]) => [k, v != null ? String(v) : ""])
            );
            await firebaseService.sendPushNotification(
                recipient.fcmToken,
                title,
                message,
                stringData
            );
        } else {
            console.log(`[NOTIFY] No FCM token for user ${userId}, skipping push.`);
        }
    } catch (err) {
        console.error("[NOTIFY] Failed to send push notification:", err.message);
    }

    return notification;
};

//Get notification
const getNotifications = async (userId, limit = 50, skip = 0) => {
    return await notificationModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

//Get unread notification count
const getNotificationCount = async (userId) => {
    const count = await notificationModel.countDocuments({ 
        user: userId, 
        isRead: false 
    });
    return { unreadCount: count };
};

//Mark notification as read
const markAsRead = async (notificationId) => {
    return await notificationModel.findByIdAndUpdate(
        notificationId,
        { isRead: true, readAt: new Date() },
        { new: true }
    );
};

//Mark all notifications as read
const markAllAsRead = async (userId) => {
    await notificationModel.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
};

//Delete notification
const deleteNotification = async (notificationId) => {
    await notificationModel.deleteOne({ _id: notificationId });
};

// Delete all notifications
const deleteAllNotifications = async (userId) => {
    await notificationModel.deleteMany({ user: userId });
};

module.exports.getNotifications = getNotifications;
module.exports.getNotification = getNotifications;
module.exports.getNotificationCount = getNotificationCount;
module.exports.markAsRead = markAsRead;
module.exports.markAllAsRead = markAllAsRead;
module.exports.deleteNotification = deleteNotification;
module.exports.deleteAllNotifications = deleteAllNotifications;

// Notify helpers (no-op safe)
module.exports.notifyNewMessage = async ({ receiver, message = "New message", planId }) => {
    if (!receiver) return null;
    return await module.exports.sendNotification(receiver, message, "New Message", { planId, type: "chat_message" });
};

module.exports.notifyNewReview = async ({ vendor, message = "New review", reviewId }) => {
    if (!vendor) return null;
    return await module.exports.sendNotification(vendor, message, "New Review", { reviewId, type: "review" });
};

module.exports.notifyPlanInvite = async ({ userId, planTitle, planId }) => {
    if (!userId) return null;
    return await module.exports.sendNotification(
        userId, 
        `You've been invited to: ${planTitle}`, 
        "Plan Invite",
        { planId, type: "invite" }
    );
};

module.exports.notifyPlanUpcoming = async ({ userId, planTitle, planId }) => {
    if (!userId) return null;
    return await module.exports.sendNotification(
        userId, 
        `${planTitle} is happening soon!`, 
        "Upcoming Plan",
        { planId, type: "reminder" }
    );
};

module.exports.notifyUserJoinedPlan = async ({ userId, planId, planTitle, joinerName }) => {
    if (!userId) return null;
    // This will now automatically send a push notification to the creator (userId) via sendNotification
    return await module.exports.sendNotification(
        userId,
        `${joinerName} joined "${planTitle}"`,
        "Member Joined",
        { planId, type: "member_joined" }
    );
};

module.exports.notifyBadgeEarned = async ({ userId, badgeName, badgeIcon }) => {
    if (!userId) return null;
    return await module.exports.sendNotification(
        userId,
        `You earned the ${badgeName} badge!`,
        "Achievement Unlocked",
        { badgeIcon, type: "badge_earned" }
    );
};

/**
 * Notify all users within a 30km radius of an official event
 * @param {object} plan The created plan object
 */
module.exports.notifyNearbyUsers = async (plan) => {
    try {
        const [lng, lat] = plan.location.coordinates;
        // 30km in meters
        const radius = 30000;

        const nearbyUsers = await userModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: radius,
                },
            },
            _id: { $ne: plan.createdBy } // Don't notify the creator
        });

        console.log(`[NOTIFY] Sending official event alerts to ${nearbyUsers.length} users nearby.`);

        const notificationPromises = nearbyUsers.map(user => 
            module.exports.sendNotification(
                user._id,
                `Official Event: "${plan.title}" is happening near you!`,
                "New Event Nearby",
                { 
                   type: "event_nearby",
                   planId: plan._id,
                   isOfficial: true 
                }
            )
        );

        await Promise.all(notificationPromises);
    } catch (err) {
        console.error("[NOTIFY] Error in notifyNearbyUsers:", err);
    }
};
