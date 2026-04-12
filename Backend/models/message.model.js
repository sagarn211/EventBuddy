const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            default: null,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        text: {
            type: String,
            required: true,
        },

        isDirect: {
            type: Boolean,
            default: false,
        },

        attachments: [
            {
                url: String,
                type: String,
            }
        ],

        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        edited: {
            type: Boolean,
            default: false,
        },

        editedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);