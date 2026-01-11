const express = require("express");
const targetsController = require("../controllers/targets-controller");
const { checkPermission } = require("../middleware/check-permission");
const router = express.Router({ mergeParams: true });

router.get("/", checkPermission("targets", "read"), targetsController.index);
router.get("/new", checkPermission("targets", "create"), targetsController.new);
router.post("/", checkPermission("targets", "create"), targetsController.create);
router.get("/:id", checkPermission("targets", "read"), targetsController.show);
router.get("/:id/edit", checkPermission("targets", "update"), targetsController.edit);
router.put("/:id", checkPermission("targets", "update"), targetsController.update);
router.delete("/:id", checkPermission("targets", "delete"), targetsController.destroy);

module.exports = router;