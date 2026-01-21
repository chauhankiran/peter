const express = require("express");
const settingController = require("../controllers/setting-controller");

const router = express.Router();

router.get("/", settingController.index);
router.post("/profile", settingController.updateProfile);
router.post("/password", settingController.updatePassword);

module.exports = router;
