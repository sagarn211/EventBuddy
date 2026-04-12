const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/firebase-login", authController.firebaseLogin);

module.exports = router;