const express = require("express");
const workController = require("../controllers/work-controller");
const { checkPermission } = require("../middleware/check-permission");
const router = express.Router();

router.get("/", checkPermission("work", "read"), workController.index);
router.get("/partial/assignees", checkPermission("work", "read"), workController.partialAssignees);
router.get("/partial/statuses", checkPermission("work", "read"), workController.partialStatuses);
router.get("/partial/priorities", checkPermission("work", "read"), workController.partialPriorities);
router.get("/new", checkPermission("work", "create"), workController.new);
router.post("/", checkPermission("work", "create"), workController.create);
router.get("/:id", checkPermission("work", "read"), workController.show);
router.get("/:id/edit", checkPermission("work", "update"), workController.edit);
router.put("/:id", checkPermission("work", "update"), workController.update);
router.delete("/:id", checkPermission("work", "delete"), workController.destroy);

module.exports = router;
