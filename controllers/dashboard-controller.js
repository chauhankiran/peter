const sql = require("../db/sql");
const { views } = require("../constants/app");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;

        try {
            const now = new Date();

            const projects = await sql`
                SELECT
                    p.id,
                    p.name,
                    p.key,
                    p."dueDate"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
                ORDER BY
                    p.name ASC
            `;

            const assignedWork = await sql`
                SELECT
                    w.id,
                    w.title,
                    w."workId",
                    w."dueDate",
                    p.id as "projectId",
                    p.key as "projectKey",
                    p.name as "projectName",
                    s.name as "statusName",
                    pr.name as "priorityName"
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
                JOIN
                    "statuses" s
                ON
                    s.id = w."statusId"
                JOIN
                    "priorities" pr
                ON
                    pr.id = w."priorityId"
                WHERE
                    w."orgId" = ${orgId} AND
                    w."isActive" = true AND
                    p."status" = 'active' AND
                    w."assigneeId" = ${userId}
                ORDER BY
                    w."dueDate" ASC NULLS LAST,
                    w.id DESC
            `;

            return res.render(views.dashboardPath, {
                now,
                projects,
                assignedWork,
            });
        } catch (err) {
            next(err);
        }
    },
};
