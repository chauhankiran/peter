const express = require("express");
const adminController = require("../controllers/admin-controller");

const router = express.Router();

router.get("/", adminController.index);
router.post("/org", adminController.updateOrg);

module.exports = router;
