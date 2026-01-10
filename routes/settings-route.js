const express = require("express");
const settingsController = require("../controllers/settings-controller");

const router = express.Router();

router.get("/", settingsController.index);
router.post("/profile", settingsController.updateProfile);
router.post("/password", settingsController.updatePassword);

module.exports = router;
