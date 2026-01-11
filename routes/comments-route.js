const express = require("express");
const commentsController = require("../controllers/comments-controller");
const router = express.Router({ mergeParams: true });

router.post("/", commentsController.create);
router.put("/:id", commentsController.update);
router.delete("/:id", commentsController.destroy);

module.exports = router;
