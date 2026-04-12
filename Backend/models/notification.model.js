const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["plan_join", "message", "badge", "system", "event_alert"],
            default: "system",
        },

        title: {
            type: String,
            default: "EventBuddy",
        },

        message: {
            type: String,
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,     
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);