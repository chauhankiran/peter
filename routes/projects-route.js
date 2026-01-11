const express = require("express");
const projectsController = require("../controllers/projects-controller");
const { checkPermission } = require("../middleware/check-permission");
const router = express.Router();

router.get("/", checkPermission("projects", "read"), projectsController.index);
router.get("/new", checkPermission("projects", "create"), projectsController.new);
router.post("/", checkPermission("projects", "create"), projectsController.create);
router.get("/:id/manage", checkPermission("projects", "update"), projectsController.manage);
router.put("/:id/manage", checkPermission("projects", "update"), projectsController.updateManage);
router.get("/:id", checkPermission("projects", "read"), projectsController.show);
router.get("/:id/edit", checkPermission("projects", "update"), projectsController.edit);
router.put("/:id", checkPermission("projects", "update"), projectsController.update);
router.delete("/:id", checkPermission("projects", "delete"), projectsController.destroy);
router.post("/:id/invite", checkPermission("projects", "update"), projectsController.invite);

module.exports = router;
