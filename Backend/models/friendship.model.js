const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "blocked"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// Compound index to ensure uniqueness and fast lookup
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model("Friendship", friendshipSchema);
