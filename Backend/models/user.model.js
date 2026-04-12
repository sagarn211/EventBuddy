const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },

        email: {
            type: String,
            unique: true,
            lowercase: true,
            sparse: true,
        },

        password: {
            type: String,
            minlength: 6,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
        },

        otp: {
            code: String,
            expiresAt: Date,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        isProfileComplete: {
            type: Boolean,
            default: false,
        },

        avatar: {
            type: String,
            default: "",
        },

        bio: {
            type: String,
            default: "",
        },

        city: {
            type: String,
            default: "",
        },

        interests: [
            {
                type: String,
            },
        ],

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], //[longitude, latitude]
                default: [0, 0]
            },
        },

        badges: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Badge",
            },
        ],

        joinedPlans: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Plan",
            },
        ],

        createdPlans: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Plan",
            },
        ],

        contacts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        isOnline: {
            type: Boolean,
            default: false,
        },

        lastSeen: {
            type: Date,
            default: Date.now,
        },


        firstName: {
            type: String,
            default: "",
        },

        lastName: {
            type: String,
            default: "",
        },

        reviewsCount: {
            type: Number,
            default: 0,
        },
        
        role: {
            type: String,
            enum: ["user", "organiser", "admin"],
            default: "user",
        },

        organizationName: {
            type: String,
            default: "",
        },
        
        fcmToken: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

//Hash password
userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

//Compare password 
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

//Generate JWT
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

//Geo index for location
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User",userSchema);
