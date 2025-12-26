const express = require("express");
const accountsController = require("../controllers/accounts-controller");
const registerController = require("../controllers/accounts/register-controller");
const loginController = require("../controllers/accounts/login-controller");
const onboardingController = require("../controllers/accounts/onboarding-controller");
const router = express.Router();

// Register
router.get("/register", registerController.register);
router.post("/register", registerController.create);

// Login
router.get("/login", loginController.login);
router.post("/login", loginController.session);

// Verify email.
router.get("/verify-email", accountsController.verify);

// Onboarding
router.get("/onboarding", onboardingController.onboarding);
router.post("/onboarding", onboardingController.setup);

module.exports = router;
