const express = require("express");
const adminController = require("../controllers/admin-controller");

const router = express.Router();

router.get("/", adminController.index);
router.post("/org", adminController.updateOrg);

// Org permissions
router.get("/permissions", adminController.orgPermissions);
router.put("/permissions", adminController.updateOrgPermissions);

// User permissions
router.get("/users/:userId/permissions", adminController.userPermissions);
router.put("/users/:userId/permissions", adminController.updateUserPermissions);

module.exports = router;
