const express = require("express");
const milestonesController = require("../controllers/milestones-controller");
const { checkPermission } = require("../middleware/check-permission");
const router = express.Router({ mergeParams: true });

router.get("/", checkPermission("milestones", "read"), milestonesController.index);
router.get("/new", checkPermission("milestones", "create"), milestonesController.new);
router.post("/", checkPermission("milestones", "create"), milestonesController.create);
router.get("/:id", checkPermission("milestones", "read"), milestonesController.show);
router.get("/:id/edit", checkPermission("milestones", "update"), milestonesController.edit);
router.put("/:id", checkPermission("milestones", "update"), milestonesController.update);
router.delete("/:id", checkPermission("milestones", "delete"), milestonesController.destroy);

module.exports = router;
