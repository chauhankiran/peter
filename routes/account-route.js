const express = require("express");

const onboardingController = require("../controllers/onboarding-controller");
const verifyController = require("../controllers/verify-controller");
const orgSelectionController = require("../controllers/org-selection-controller");

const router = express.Router();

// Verify email.
router.get("/verify-email", verifyController.verify);

// Onboarding
// TODO: Move to org
router.get("/onboarding", onboardingController.onboarding);
router.post("/onboarding", onboardingController.setup);


// Select org
// TODO: Move to org
router.get("/choose-org", orgSelectionController.choose);
router.post("/choose-org", orgSelectionController.select);

module.exports = router;
