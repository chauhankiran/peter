const express = require("express");

const inviteController = require("../controllers/invite-controller");

const router = express.Router();

router.get("/invite", inviteController.invite);

module.exports = router;