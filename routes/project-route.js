const express = require("express");
const projectController = require("../controllers/project-controller");
const router = express.Router();

router.get("/", projectController.index);
router.get("/new", projectController.new);
router.post("/", projectController.create);
router.get("/:id/manage", projectController.manage);
router.put("/:id/manage", projectController.updateManage);
router.get("/:id", projectController.show);
router.get("/:id/edit", projectController.edit);
router.put("/:id", projectController.update);
router.delete("/:id", projectController.destroy);
router.post("/:id/invite", projectController.invite);

module.exports = router;
