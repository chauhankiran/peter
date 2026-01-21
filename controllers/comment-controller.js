const sql = require("../db/sql");

module.exports = {
    create: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const workId = req.params.workId;
        const { body } = req.body;

        if (!body || !body.trim()) {
            req.flash("error", "Comment cannot be empty.");
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
                req.flash("error", "Work not found.");
                return res.redirect("/work");
            }

            await sql`
                INSERT INTO "comments" (
                    "orgId",
                    "workId",
                    "userId",
                    body,
                    "createdBy"
                ) VALUES (
                    ${orgId},
                    ${workId},
                    ${userId},
                    ${body.trim()},
                    ${userId}
                )
            `;

            req.flash("info", "Comment added successfully.");
            return res.redirect(`/work/${workId}`);
        } catch (err) {
            next(err);
        }
    },

    update: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const role = req.session.role;
        const workId = req.params.workId;
        const commentId = req.params.id;
        const { body } = req.body;

        if (!body || !body.trim()) {
            req.flash("error", "Comment cannot be empty.");
            return res.redirect(`/work/${workId}`);
        }

        try {
            const comment = await sql`
                SELECT
                    c.id,
                    c."userId"
                FROM
                    "comments" c
                WHERE
                    c.id = ${commentId} AND
                    c."orgId" = ${orgId} AND
                    c."isActive" = true
            `.then(([x]) => x);

            if (!comment) {
                req.flash("error", "Comment not found.");
                return res.redirect(`/work/${workId}`);
            }

            // Check if user is admin/owner or the comment creator
            const isAdminOrOwner = role === "admin" || role === "owner";
            const isCreator = String(comment.userId) === String(userId);

            if (!isAdminOrOwner && !isCreator) {
                req.flash(
                    "error",
                    "You don't have permission to edit this comment.",
                );
                return res.redirect(`/work/${workId}`);
            }

            await sql`
                UPDATE "comments"
                SET
                    body = ${body.trim()},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${commentId}
            `;

            req.flash("info", "Comment updated successfully.");
            return res.redirect(`/work/${workId}`);
        } catch (err) {
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const role = req.session.role;
        const workId = req.params.workId;
        const commentId = req.params.id;

        try {
            const comment = await sql`
                SELECT
                    c.id,
                    c."userId"
                FROM
                    "comments" c
                WHERE
                    c.id = ${commentId} AND
                    c."orgId" = ${orgId} AND
                    c."isActive" = true
            `.then(([x]) => x);

            if (!comment) {
                req.flash("error", "Comment not found.");
                return res.redirect(`/work/${workId}`);
            }

            // Check if user is admin/owner or the comment creator
            const isAdminOrOwner = role === "admin" || role === "owner";
            const isCreator = String(comment.userId) === String(userId);

            if (!isAdminOrOwner && !isCreator) {
                req.flash(
                    "error",
                    "You don't have permission to delete this comment.",
                );
                return res.redirect(`/work/${workId}`);
            }

            await sql`
                UPDATE "comments"
                SET
                    "isActive" = false,
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${commentId}
            `;

            req.flash("info", "Comment deleted successfully.");
            return res.redirect(`/work/${workId}`);
        } catch (err) {
            next(err);
        }
    },
};
