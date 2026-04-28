const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
        },

        category: {
            type: String,
            // Keep this in sync with client category ids; accept common legacy variants too.
            enum: [
                "movie",
                "cafe",
                "event",
                "gaming",
                "food",
                "sports",
                "sport",
                "study",
                "other",
                "livemusic",
                "foodcrawl",
                "fitness",
                "social",
                "art",
                "outdoor",
            ],
            required: true,
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
            },
            address: {
                type: String,
            },
        },

        dateTime: {
            type: Date,
            required: true,
        },

        startDateTime: {
            type: Date,
            default: function() { return this.dateTime; }
        },

        endDateTime: {
            type: Date,
            default: function() { return new Date(this.dateTime.getTime() + 3600000); }
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        maxPeople: {
          type: Number,
          default: 5,
        },

        status: {
            type: String,
            enum: ["active", "full", "completed", "ended"],
            default: "active",
        },

        savedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        isOfficial: {
            type: Boolean,
            default: false,
        },

        ticketUrl: {
            type: String,
            default: "",
        },

        bannerImage: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

planSchema.index({ location:"2dsphere" });

module.exports = mongoose.model("Plan", planSchema);
