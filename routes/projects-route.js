const express = require("express");
const projectsController = require("../controllers/projects-controller");
const router = express.Router();

router.get("/", projectsController.index);
router.get("/new", projectsController.new);
router.post("/", projectsController.create);
router.get("/:id", projectsController.show);
router.get("/:id/edit", projectsController.edit);
router.put("/:id", projectsController.update);
router.delete("/:id", projectsController.destroy);
router.post("/:id/invite", projectsController.invite);

module.exports = router;
