const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const attachmentController = require("../controllers/attachment-controller");

const router = express.Router({ mergeParams: true });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

router.post("/", upload.single("file"), attachmentController.create);
router.get("/:id/download", attachmentController.download);
router.delete("/:id", attachmentController.destroy);

module.exports = router;
