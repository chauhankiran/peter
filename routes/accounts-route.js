const express = require("express");
const registerController = require("../controllers/accounts/register-controller");
const loginController = require("../controllers/accounts/login-controller");
const onboardingController = require("../controllers/accounts/onboarding-controller");
const logoutController = require("../controllers/accounts/logout-controller");
const verifyController = require("../controllers/accounts/verify-controller");

const router = express.Router();

// Register
router.get("/register", registerController.register);
router.post("/register", registerController.create);

// Login
router.get("/login", loginController.login);
router.post("/login", loginController.session);

// Verify email.
router.get("/verify-email", verifyController.verify);

// Onboarding
router.get("/onboarding", onboardingController.onboarding);
router.post("/onboarding", onboardingController.setup);

// Logout
router.get("/logout", logoutController.destroy);

module.exports = router;
