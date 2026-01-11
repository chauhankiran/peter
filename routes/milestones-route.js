const express = require("express");
const milestonesController = require("../controllers/milestones-controller");
const router = express.Router({ mergeParams: true });

router.get("/", milestonesController.index);
router.get("/new", milestonesController.new);
router.post("/", milestonesController.create);
router.get("/:id", milestonesController.show);
router.get("/:id/edit", milestonesController.edit);
router.put("/:id", milestonesController.update);
router.delete("/:id", milestonesController.destroy);

module.exports = router;
