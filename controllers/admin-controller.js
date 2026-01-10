const sql = require("../db/sql");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.orgId;

        try {
            const org = await sql`
                SELECT
                    id,
                    name,
                    "createdAt",
                    "updatedAt",
                    "isActive"
                FROM
                    orgs
                WHERE
                    id = ${orgId}
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
                    p.key,
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
};
