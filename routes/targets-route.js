const express = require("express");
const targetsController = require("../controllers/targets-controller");
const router = express.Router({ mergeParams: true });

router.get("/", targetsController.index);
router.get("/new", targetsController.new);
router.post("/", targetsController.create);
router.get("/:id", targetsController.show);
router.get("/:id/edit", targetsController.edit);
router.put("/:id", targetsController.update);
router.delete("/:id", targetsController.destroy);

module.exports = router;