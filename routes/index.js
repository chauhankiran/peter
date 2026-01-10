const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/is-auth");

router.use("/", require("./home-route"));
router.use("/", require("./accounts-route"));
router.use("/dashboard", isAuth, require("./dashboard-route"));
router.use("/projects", isAuth, require("./projects-route"));
router.use("/work", isAuth, require("./work-route"));

module.exports = router;
