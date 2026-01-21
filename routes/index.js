const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");

router.use("/", require("./home-route"));
router.use('/', require('./login-route'));
router.use('/', require('./register-route'));
router.use('/', require('./invite-route'));
router.use("/", require("./account-route"));

// Routes come after this line are protected.
router.use(isAuth);

router.use("/dashboard", require("./dashboard-route"));
router.use("/settings", require("./setting-route"));
router.use("/admin", isAdmin, require("./admin-route"));
router.use("/projects", require("./project-route"));
router.use("/work", require("./work-route"));
router.use("/work/:workId/comments", require("./comment-route"));
router.use("/projects/:projectId/milestones", require("./milestone-route"));
router.use("/projects/:projectId/targets", require("./target-route"));
router.use("/work/:workId/attachments", require("./attachment-route"));

router.use('/', require('./logout-route'));

module.exports = router;
