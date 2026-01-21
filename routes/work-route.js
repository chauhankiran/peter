const express = require("express");
const workController = require("../controllers/work-controller");

const router = express.Router();

router.get("/", workController.index);
router.get(
    "/partial/assignees",

    workController.partialAssignees,
);
router.get(
    "/partial/statuses",

    workController.partialStatuses,
);
router.get(
    "/partial/priorities",

    workController.partialPriorities,
);
router.get(
    "/partial/milestones",

    workController.partialMilestones,
);
router.get("/new", workController.new);
router.post("/", workController.create);
router.get("/:id", workController.show);
router.get("/:id/edit", workController.edit);
router.put("/:id", workController.update);
router.delete(
    "/:id",

    workController.destroy,
);

module.exports = router;
