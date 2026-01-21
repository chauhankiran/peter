const express = require("express");
const commentController = require("../controllers/comment-controller");

const router = express.Router({ mergeParams: true });

router.post("/", commentController.create);
router.put("/:id", commentController.update);
router.delete("/:id", commentController.destroy);

module.exports = router;
