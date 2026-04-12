const crypto = require("crypto");
const userModel = require("../models/user.model");

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
    return crypto.createHash("sha256").update(otp).digest("hex");
};

// Send OTP
module.exports.sendOTP = async (phone) => {
    let user = await userModel.findOne({ phone });

    if(!user){
        user = await userModel.create({ phone });
    }

    const otp = generateOTP();

    user.otp = {
        code: hashOTP(otp),
        expiresAt: Date.now() + 5 * 60 * 1000,
    };

    await user.save();

    // Development mode: just log the OTP to terminal
    console.log("-----------------------");
    console.log(`OTP for ${phone}: ${otp}`);
    console.log("-----------------------");

    return { message: "OTP sent successfully" };
};

//Verify OTP
module.exports.verifyOTP = async (phone, enteredOTP) =>{
    const user = await userModel.findOne({ phone });

    if(!user || !user.otp){
        throw new Error("OTP not found");
    }

    if (user.otp.expiresAt < Date.now()) {
        throw new Error("OTP expired");
    }

    const isValid = hashOTP(enteredOTP) === user.otp.code;

    if(!isValid) {
        throw new Error("invalid OTP");
    }

    user.isVerified = true;
    user.otp = undefined;

    await user.save();

    return user;
}
