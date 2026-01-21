const express = require("express");
const registerController = require("../controllers/register-controller");

const router = express.Router();

router.get("/register", registerController.index);
router.post("/register", registerController.register);

module.exports = router;