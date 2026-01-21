const express = require("express");
const targetController = require("../controllers/target-controller");

const router = express.Router({ mergeParams: true });

router.get("/", targetController.index);
router.get("/new", targetController.new);
router.post("/", targetController.create);
router.get("/:id", targetController.show);
router.get("/:id/edit", targetController.edit);
router.put("/:id", targetController.update);
router.delete("/:id", targetController.destroy);

module.exports = router;
