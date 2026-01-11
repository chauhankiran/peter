const sql = require("../db/sql");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.orgId;

        try {
            const org = await sql`
                SELECT
                    o.id,
                    o.name,
                    o."createdAt",
                    o."updatedAt",
                    o."isActive"
                FROM
                    orgs o
                WHERE
                    o.id = ${orgId}
            `.then(([x]) => x);

            if (!org) {
                const err = {
                    code: 404,
                    message: "Organization not found.",
                };
                return res.status(404).render("error", { err });
            }

            const users = await sql`
                SELECT
                    u.id,
                    u."firstName",
                    u."lastName",
                    u.email,
                    u."status",
                    uo.role,
                    uo."createdAt" as "joinedAt"
                FROM
                    "userOrgs" uo
                JOIN
                    users u
                ON
                    u.id = uo."userId"
                WHERE
                    uo."orgId" = ${orgId} AND
                    uo."isActive" = true
                ORDER BY
                    u."firstName" ASC,
                    u."lastName" ASC
            `;

            const projects = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."dueDate",
                    p."status",
                    p."createdAt"
                FROM
                    projects p
                WHERE
                    p."orgId" = ${orgId}
                ORDER BY
                    p.name ASC
            `;

            return res.render("admin/index", {
                org,
                users,
                projects,
            });
        } catch (err) {
            next(err);
        }
    },

    updateOrg: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const { name } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Org name is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;
            return res.redirect("/admin");
        }

        try {
            const org = await sql`
                UPDATE
                    orgs
                SET
                    name = ${name},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${orgId}
                RETURNING
                    id
            `.then(([x]) => x);

            if (!org) {
                const err = {
                    code: 404,
                    message: "Organization not found.",
                };
                return res.status(404).render("error", { err });
            }

            req.flash("info", "Organization updated successfully.");
            return res.redirect("/admin");
        } catch (err) {
            next(err);
        }
    },

    // Org Permissions
    orgPermissions: async (req, res, next) => {
        const orgId = req.session.orgId;

        try {
            let orgPermissions = await sql`
                SELECT
                    "projectsEnabled",
                    "workEnabled",
                    "milestonesEnabled",
                    "targetsEnabled",
                    "commentsEnabled",
                    "attachmentsEnabled"
                FROM
                    "orgPermissions"
                WHERE
                    "orgId" = ${orgId}
            `.then(([x]) => x);

            // Default values if no record exists
            if (!orgPermissions) {
                orgPermissions = {
                    projectsEnabled: true,
                    workEnabled: true,
                    milestonesEnabled: true,
                    targetsEnabled: true,
                    commentsEnabled: true,
                    attachmentsEnabled: true,
                };
            }

            return res.render("admin/org-permissions", { orgPermissions });
        } catch (err) {
            next(err);
        }
    },

    updateOrgPermissions: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const {
            projectsEnabled,
            workEnabled,
            milestonesEnabled,
            targetsEnabled,
            commentsEnabled,
            attachmentsEnabled,
        } = req.body;

        try {
            // Check if record exists
            const existing = await sql`
                SELECT id FROM "orgPermissions" WHERE "orgId" = ${orgId}
            `.then(([x]) => x);

            if (existing) {
                await sql`
                    UPDATE "orgPermissions"
                    SET
                        "projectsEnabled" = ${projectsEnabled === "true"},
                        "workEnabled" = ${workEnabled === "true"},
                        "milestonesEnabled" = ${milestonesEnabled === "true"},
                        "targetsEnabled" = ${targetsEnabled === "true"},
                        "commentsEnabled" = ${commentsEnabled === "true"},
                        "attachmentsEnabled" = ${attachmentsEnabled === "true"},
                        "updatedBy" = ${userId},
                        "updatedAt" = now()
                    WHERE
                        "orgId" = ${orgId}
                `;
            } else {
                await sql`
                    INSERT INTO "orgPermissions" (
                        "orgId",
                        "projectsEnabled",
                        "workEnabled",
                        "milestonesEnabled",
                        "targetsEnabled",
                        "commentsEnabled",
                        "attachmentsEnabled",
                        "createdBy"
                    ) VALUES (
                        ${orgId},
                        ${projectsEnabled === "true"},
                        ${workEnabled === "true"},
                        ${milestonesEnabled === "true"},
                        ${targetsEnabled === "true"},
                        ${commentsEnabled === "true"},
                        ${attachmentsEnabled === "true"},
                        ${userId}
                    )
                `;
            }

            req.flash("info", "Organization permissions updated successfully.");
            return res.redirect("/admin/permissions");
        } catch (err) {
            next(err);
        }
    },

    // User Permissions
    userPermissions: async (req, res, next) => {
        const orgId = req.session.orgId;
        const targetUserId = req.params.userId;

        try {
            const user = await sql`
                SELECT
                    u.id,
                    u."firstName",
                    u."lastName",
                    u.email,
                    uo.role
                FROM
                    users u
                JOIN
                    "userOrgs" uo
                ON
                    uo."userId" = u.id AND
                    uo."orgId" = ${orgId}
                WHERE
                    u.id = ${targetUserId}
            `.then(([x]) => x);

            if (!user) {
                req.flash("error", "User not found.");
                return res.redirect("/admin");
            }

            let userPermissions = await sql`
                SELECT
                    "isEnabled",
                    "projectsCreate", "projectsRead", "projectsUpdate", "projectsDelete",
                    "workCreate", "workRead", "workUpdate", "workDelete",
                    "milestonesCreate", "milestonesRead", "milestonesUpdate", "milestonesDelete",
                    "targetsCreate", "targetsRead", "targetsUpdate", "targetsDelete",
                    "commentsCreate", "commentsRead", "commentsUpdate", "commentsDelete",
                    "attachmentsCreate", "attachmentsRead", "attachmentsUpdate", "attachmentsDelete"
                FROM
                    "userPermissions"
                WHERE
                    "orgId" = ${orgId} AND
                    "userId" = ${targetUserId}
            `.then(([x]) => x);

            // Default values based on role
            if (!userPermissions) {
                const isAdminOrOwner = user.role === "admin" || user.role === "owner";
                userPermissions = {
                    isEnabled: true,
                    projectsCreate: true,
                    projectsRead: true,
                    projectsUpdate: true,
                    projectsDelete: true,
                    workCreate: true,
                    workRead: true,
                    workUpdate: true,
                    workDelete: true,
                    milestonesCreate: isAdminOrOwner,
                    milestonesRead: true,
                    milestonesUpdate: isAdminOrOwner,
                    milestonesDelete: isAdminOrOwner,
                    targetsCreate: isAdminOrOwner,
                    targetsRead: true,
                    targetsUpdate: isAdminOrOwner,
                    targetsDelete: isAdminOrOwner,
                    commentsCreate: true,
                    commentsRead: true,
                    commentsUpdate: true,
                    commentsDelete: true,
                    attachmentsCreate: true,
                    attachmentsRead: true,
                    attachmentsUpdate: true,
                    attachmentsDelete: true,
                };
            }

            return res.render("admin/user-permissions", { user, userPermissions });
        } catch (err) {
            next(err);
        }
    },

    updateUserPermissions: async (req, res, next) => {
        const orgId = req.session.orgId;
        const currentUserId = req.session.userId;
        const targetUserId = req.params.userId;
        const {
            isEnabled,
            projectsCreate, projectsRead, projectsUpdate, projectsDelete,
            workCreate, workRead, workUpdate, workDelete,
            milestonesCreate, milestonesRead, milestonesUpdate, milestonesDelete,
            targetsCreate, targetsRead, targetsUpdate, targetsDelete,
            commentsCreate, commentsRead, commentsUpdate, commentsDelete,
            attachmentsCreate, attachmentsRead, attachmentsUpdate, attachmentsDelete,
        } = req.body;

        try {
            // Check if record exists
            const existing = await sql`
                SELECT id FROM "userPermissions" 
                WHERE "orgId" = ${orgId} AND "userId" = ${targetUserId}
            `.then(([x]) => x);

            if (existing) {
                await sql`
                    UPDATE "userPermissions"
                    SET
                        "isEnabled" = ${isEnabled === "true"},
                        "projectsCreate" = ${projectsCreate === "true"},
                        "projectsRead" = ${projectsRead === "true"},
                        "projectsUpdate" = ${projectsUpdate === "true"},
                        "projectsDelete" = ${projectsDelete === "true"},
                        "workCreate" = ${workCreate === "true"},
                        "workRead" = ${workRead === "true"},
                        "workUpdate" = ${workUpdate === "true"},
                        "workDelete" = ${workDelete === "true"},
                        "milestonesCreate" = ${milestonesCreate === "true"},
                        "milestonesRead" = ${milestonesRead === "true"},
                        "milestonesUpdate" = ${milestonesUpdate === "true"},
                        "milestonesDelete" = ${milestonesDelete === "true"},
                        "targetsCreate" = ${targetsCreate === "true"},
                        "targetsRead" = ${targetsRead === "true"},
                        "targetsUpdate" = ${targetsUpdate === "true"},
                        "targetsDelete" = ${targetsDelete === "true"},
                        "commentsCreate" = ${commentsCreate === "true"},
                        "commentsRead" = ${commentsRead === "true"},
                        "commentsUpdate" = ${commentsUpdate === "true"},
                        "commentsDelete" = ${commentsDelete === "true"},
                        "attachmentsCreate" = ${attachmentsCreate === "true"},
                        "attachmentsRead" = ${attachmentsRead === "true"},
                        "attachmentsUpdate" = ${attachmentsUpdate === "true"},
                        "attachmentsDelete" = ${attachmentsDelete === "true"},
                        "updatedBy" = ${currentUserId},
                        "updatedAt" = now()
                    WHERE
                        "orgId" = ${orgId} AND
                        "userId" = ${targetUserId}
                `;
            } else {
                await sql`
                    INSERT INTO "userPermissions" (
                        "orgId",
                        "userId",
                        "isEnabled",
                        "projectsCreate", "projectsRead", "projectsUpdate", "projectsDelete",
                        "workCreate", "workRead", "workUpdate", "workDelete",
                        "milestonesCreate", "milestonesRead", "milestonesUpdate", "milestonesDelete",
                        "targetsCreate", "targetsRead", "targetsUpdate", "targetsDelete",
                        "commentsCreate", "commentsRead", "commentsUpdate", "commentsDelete",
                        "attachmentsCreate", "attachmentsRead", "attachmentsUpdate", "attachmentsDelete",
                        "createdBy"
                    ) VALUES (
                        ${orgId},
                        ${targetUserId},
                        ${isEnabled === "true"},
                        ${projectsCreate === "true"}, ${projectsRead === "true"}, ${projectsUpdate === "true"}, ${projectsDelete === "true"},
                        ${workCreate === "true"}, ${workRead === "true"}, ${workUpdate === "true"}, ${workDelete === "true"},
                        ${milestonesCreate === "true"}, ${milestonesRead === "true"}, ${milestonesUpdate === "true"}, ${milestonesDelete === "true"},
                        ${targetsCreate === "true"}, ${targetsRead === "true"}, ${targetsUpdate === "true"}, ${targetsDelete === "true"},
                        ${commentsCreate === "true"}, ${commentsRead === "true"}, ${commentsUpdate === "true"}, ${commentsDelete === "true"},
                        ${attachmentsCreate === "true"}, ${attachmentsRead === "true"}, ${attachmentsUpdate === "true"}, ${attachmentsDelete === "true"},
                        ${currentUserId}
                    )
                `;
            }

            req.flash("info", "User permissions updated successfully.");
            return res.redirect(`/admin/users/${targetUserId}/permissions`);
        } catch (err) {
            next(err);
        }
    },
};
