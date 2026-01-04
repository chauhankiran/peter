const express = require("express");
const router = express.Router();

router.use("/", require("./home-route"));
router.use("/", require("./accounts-route"));
router.use("/dashboard", require("./dashboard-route"));
router.use("/projects", require("./projects-route"));
router.use("/work", require("./work-route"));

module.exports = router;
