const express = require("express");
const commentsController = require("../controllers/comments-controller");
const { checkPermission } = require("../middleware/check-permission");
const router = express.Router({ mergeParams: true });

router.post("/", checkPermission("comments", "create"), commentsController.create);
router.put("/:id", checkPermission("comments", "update"), commentsController.update);
router.delete("/:id", checkPermission("comments", "delete"), commentsController.destroy);

module.exports = router;
