const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");

router.use("/", require("./home-route"));
router.use("/", require("./accounts-route"));
router.use("/dashboard", isAuth, require("./dashboard-route"));
router.use("/settings", isAuth, require("./settings-route"));
router.use("/admin", isAuth, isAdmin, require("./admin-route"));
router.use("/projects", isAuth, require("./projects-route"));
router.use("/work", isAuth, require("./work-route"));
router.use("/work/:workId/comments", isAuth, require("./comments-route"));

module.exports = router;
