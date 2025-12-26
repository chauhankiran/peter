const express = require("express");
const router = express.Router();

router.use("/", require("./home-route"));
router.use("/", require("./accounts-route"));
router.use("/dashboard", require("./dashboard-route"));

module.exports = router;
