const express = require("express");

const loginController = require("../controllers/login-controller");

const router = express.Router();

// Login
router.get("/login", loginController.index);
router.post("/login", loginController.login);

module.exports = router;
