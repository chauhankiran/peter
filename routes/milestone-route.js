const express = require("express");
const milestoneController = require("../controllers/milestone-controller");

const router = express.Router({ mergeParams: true });

router.get("/", milestoneController.index);
router.get("/new", milestoneController.new);
router.post("/", milestoneController.create);
router.get("/:id", milestoneController.show);
router.get("/:id/edit", milestoneController.edit);
router.put("/:id", milestoneController.update);
router.delete("/:id", milestoneController.destroy);

module.exports = router;
