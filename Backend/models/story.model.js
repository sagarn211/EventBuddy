const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        userAvatar: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["text", "photo", "video"],
            default: "text",
        },
        text: {
            type: String,
            default: "",
        },
        media: {
            type: String, // URL from ImageKit
            default: "",
        },
        mediaId: {
            type: String, // fileId from ImageKit (for deletion)
            default: "",
        },
        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },
        selectedContacts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        // TTL index for automatic deletion after 24 hours
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 86400, // 24 hours in seconds
        },
    },
    { timestamps: true }
);

// Index for fetching stories of specific users efficiently
storySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);
