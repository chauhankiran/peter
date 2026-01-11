const sql = require("../db/sql");
const path = require("path");
const fs = require("fs");

module.exports = {
    create: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const workId = req.params.workId;

        if (!req.file) {
            req.flash("error", "No file uploaded.");
            return res.redirect(`/work/${workId}`);
        }

        try {
            // Verify user has access to this work item
            const work = await sql`
                SELECT
                    w.id
                FROM
                    "work" w
                JOIN
                    projects p
                ON
                    p.id = w."projectId"
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    w.id = ${workId} AND
                    w."orgId" = ${orgId} AND
                    w."isActive" = true AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!work) {
                // Delete uploaded file if work not found
                fs.unlinkSync(req.file.path);
                req.flash("error", "Work not found.");
                return res.redirect("/work");
            }

            await sql`
                INSERT INTO "attachments" (
                    "orgId",
                    "workId",
                    "userId",
                    "fileName",
                    "originalName",
                    "mimeType",
                    "fileSize",
                    "filePath",
                    "createdBy"
                ) VALUES (
                    ${orgId},
                    ${workId},
                    ${userId},
                    ${req.file.filename},
                    ${req.file.originalname},
                    ${req.file.mimetype},
                    ${req.file.size},
                    ${req.file.path},
                    ${userId}
                )
            `;

            req.flash("info", "Attachment uploaded successfully.");
            return res.redirect(`/work/${workId}`);
        } catch (err) {
            // Delete uploaded file on error
            if (req.file && req.file.path) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) {
                    console.error("Failed to delete file:", e);
                }
            }
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const role = req.session.role;
        const workId = req.params.workId;
        const attachmentId = req.params.id;

        try {
            const attachment = await sql`
                SELECT
                    a.id,
                    a."userId",
                    a."filePath"
                FROM
                    "attachments" a
                WHERE
                    a.id = ${attachmentId} AND
                    a."workId" = ${workId} AND
                    a."orgId" = ${orgId} AND
                    a."isActive" = true
            `.then(([x]) => x);

            if (!attachment) {
                req.flash("error", "Attachment not found.");
                return res.redirect(`/work/${workId}`);
            }

            // Check if user is admin/owner or the attachment uploader
            const isAdminOrOwner = role === "admin" || role === "owner";
            const isUploader = String(attachment.userId) === String(userId);

            if (!isAdminOrOwner && !isUploader) {
                req.flash("error", "You don't have permission to delete this attachment.");
                return res.redirect(`/work/${workId}`);
            }

            // Soft delete
            await sql`
                UPDATE "attachments"
                SET
                    "isActive" = false
                WHERE
                    id = ${attachmentId}
            `;

            // Optionally delete the physical file
            try {
                if (attachment.filePath && fs.existsSync(attachment.filePath)) {
                    fs.unlinkSync(attachment.filePath);
                }
            } catch (e) {
                console.error("Failed to delete physical file:", e);
            }

            req.flash("info", "Attachment deleted successfully.");
            return res.redirect(`/work/${workId}`);
        } catch (err) {
            next(err);
        }
    },

    download: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const workId = req.params.workId;
        const attachmentId = req.params.id;

        try {
            // Verify user has access to the work item
            const work = await sql`
                SELECT
                    w.id
                FROM
                    "work" w
                JOIN
                    projects p
                ON
                    p.id = w."projectId"
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    w.id = ${workId} AND
                    w."orgId" = ${orgId} AND
                    w."isActive" = true AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!work) {
                req.flash("error", "Work not found.");
                return res.redirect("/work");
            }

            const attachment = await sql`
                SELECT
                    a.id,
                    a."filePath",
                    a."originalName",
                    a."mimeType"
                FROM
                    "attachments" a
                WHERE
                    a.id = ${attachmentId} AND
                    a."workId" = ${workId} AND
                    a."orgId" = ${orgId} AND
                    a."isActive" = true
            `.then(([x]) => x);

            if (!attachment) {
                req.flash("error", "Attachment not found.");
                return res.redirect(`/work/${workId}`);
            }

            if (!fs.existsSync(attachment.filePath)) {
                req.flash("error", "File not found on server.");
                return res.redirect(`/work/${workId}`);
            }

            res.download(attachment.filePath, attachment.originalName);
        } catch (err) {
            next(err);
        }
    },
};
