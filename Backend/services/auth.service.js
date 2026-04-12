const { generateAuthToken } = require("./token.service");
const { sendOTP, verifyOTP } = require("./otp.service");
const { verifyFirebaseToken } = require("./firebase.service");

// Request OTP
module.exports.sendOtp = async ({ phone, phoneNumber }) => {
    const normalizedPhone = phone || phoneNumber;
    if (!normalizedPhone) {
        throw new Error("Phone number is required");
    }
    return await sendOTP(normalizedPhone);
};

// Verify OTP (login)
module.exports.verifyOtp = async ({ phone, phoneNumber, otp }) => {
    const normalizedPhone = phone || phoneNumber;
    if (!normalizedPhone || !otp) {
        throw new Error("Phone number and OTP are required");
    }
    const user = await verifyOTP(normalizedPhone, otp);

    const token = generateAuthToken(user._id);

    return {
        message: "Login successful",
        user,
        token,
    };
};

// Firebase Login/Registration
module.exports.firebaseLogin = async ({ idToken, phone }) => {
    if (!idToken) {
        throw new Error("Firebase ID token is required");
    }

    // 1. Verify token with Firebase
    const decodedToken = await verifyFirebaseToken(idToken);
    const { uid } = decodedToken;

    // Use the phone provided from client (already verified)
    // Firebase phone_number may be missing from ID token
    const normalizedPhone = phone || decodedToken.phone_number;
    if (!normalizedPhone) {
        throw new Error("Phone number is required for registration");
    }

    const User = require("../models/user.model");

    // 2. Find or create user
    let user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
        user = new User({
            phone: normalizedPhone,
            isVerified: true,
        });
        await user.save();
    } else {
        // Ensure user is marked as verified
        if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
        }
    }

    // 3. Generate backend token
    const token = user.generateAuthToken();

    return {
        message: "Login successful",
        user,
        token,
    };
};

// Email/Password Registration
module.exports.register = async ({ name, email, phone, password }) => {
    const User = require("../models/user.model");

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        throw new Error("Email or Phone already registered");
    }

    const user = new User({
        name,
        email,
        phone,
        password,
        isVerified: true // Assume verified for demo, or add email verification later
    });

    await user.save();
    
    const token = user.generateAuthToken();
    return { user, token };
};

// Email/Password Login
module.exports.login = async ({ email, password }) => {
    const User = require("../models/user.model");

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    const token = user.generateAuthToken();
    return { user, token };
};
