const sql = require("../db/sql");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;

        try {
            // Verify project access and milestones enabled
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            if (!project.milestonesEnabled) {
                req.flash("error", "Milestones are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const milestones = await sql`
                SELECT
                    m.id,
                    m.name,
                    m.description,
                    m."dueDate",
                    m."createdAt",
                    (
                        SELECT COUNT(*) 
                        FROM work w 
                        WHERE w."milestoneId" = m.id 
                        AND w."isActive" = true
                    ) as "totalWork",
                    (
                        SELECT COUNT(*) 
                        FROM work w 
                        JOIN statuses s ON s.id = w."statusId"
                        WHERE w."milestoneId" = m.id 
                        AND w."isActive" = true
                        AND s."isDone" = true
                    ) as "completedWork"
                FROM
                    milestones m
                WHERE
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."isActive" = true
                ORDER BY
                    m."dueDate" ASC NULLS LAST,
                    m.name ASC
            `;

            // Calculate progress percentage for each milestone
            const milestonesWithProgress = milestones.map(m => ({
                ...m,
                progress: m.totalWork > 0 ? Math.round((m.completedWork / m.totalWork) * 100) : 0
            }));

            return res.render("milestones/index", {
                milestones: milestonesWithProgress,
                project,
            });
        } catch (err) {
            next(err);
        }
    },

    new: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            if (!project.milestonesEnabled) {
                req.flash("error", "Milestones are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const milestone = {
                name: "",
                description: "",
                dueDate: "",
            };

            return res.render("milestones/new", { milestone, project });
        } catch (err) {
            next(err);
        }
    },

    create: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const { name, description, dueDate } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            if (!project.milestonesEnabled) {
                req.flash("error", "Milestones are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const milestone = {
                name: name || "",
                description: description || "",
                dueDate: dueDate || "",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("milestones/new", { milestone, project });
            }

            await sql`
                INSERT INTO milestones (
                    "orgId",
                    "projectId",
                    name,
                    description,
                    "dueDate",
                    "createdBy"
                ) VALUES (
                    ${orgId},
                    ${projectId},
                    ${name},
                    ${description || null},
                    ${dueDate || null},
                    ${userId}
                )
            `;

            req.flash("info", "Milestone created successfully.");
            return res.redirect(`/projects/${projectId}/milestones`);
        } catch (err) {
            next(err);
        }
    },

    show: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            if (!project.milestonesEnabled) {
                req.flash("error", "Milestones are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const milestone = await sql`
                SELECT
                    m.id,
                    m.name,
                    m.description,
                    m."dueDate",
                    m."createdAt",
                    (
                        SELECT COUNT(*) 
                        FROM work w 
                        WHERE w."milestoneId" = m.id 
                        AND w."isActive" = true
                    ) as "totalWork",
                    (
                        SELECT COUNT(*) 
                        FROM work w 
                        JOIN statuses s ON s.id = w."statusId"
                        WHERE w."milestoneId" = m.id 
                        AND w."isActive" = true
                        AND s."isDone" = true
                    ) as "completedWork"
                FROM
                    milestones m
                WHERE
                    m.id = ${milestoneId} AND
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."isActive" = true
            `.then(([x]) => x);

            if (!milestone) {
                req.flash("error", "Milestone not found.");
                return res.redirect(`/projects/${projectId}/milestones`);
            }

            milestone.progress = milestone.totalWork > 0 
                ? Math.round((milestone.completedWork / milestone.totalWork) * 100) 
                : 0;

            // Get work items in this milestone
            const workItems = await sql`
                SELECT
                    w.id,
                    w.title,
                    w."workId",
                    s.name as "statusName",
                    s."isDone",
                    pr.name as "priorityName",
                    p.key as "projectKey"
                FROM
                    work w
                JOIN
                    statuses s ON s.id = w."statusId"
                JOIN
                    priorities pr ON pr.id = w."priorityId"
                JOIN
                    projects p ON p.id = w."projectId"
                WHERE
                    w."milestoneId" = ${milestoneId} AND
                    w."orgId" = ${orgId} AND
                    w."isActive" = true
                ORDER BY
                    s."isDone" ASC,
                    w.id DESC
            `;

            return res.render("milestones/show", { milestone, project, workItems });
        } catch (err) {
            next(err);
        }
    },

    edit: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            if (!project.milestonesEnabled) {
                req.flash("error", "Milestones are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const milestoneRow = await sql`
                SELECT
                    m.id,
                    m.name,
                    m.description,
                    m."dueDate"
                FROM
                    milestones m
                WHERE
                    m.id = ${milestoneId} AND
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."isActive" = true
            `.then(([x]) => x);

            if (!milestoneRow) {
                req.flash("error", "Milestone not found.");
                return res.redirect(`/projects/${projectId}/milestones`);
            }

            const milestone = {
                id: milestoneRow.id,
                name: milestoneRow.name,
                description: milestoneRow.description || "",
                dueDate: milestoneRow.dueDate || "",
            };

            return res.render("milestones/edit", { milestone, project });
        } catch (err) {
            next(err);
        }
    },

    update: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;
        const { name, description, dueDate } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            if (!project.milestonesEnabled) {
                req.flash("error", "Milestones are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const milestone = {
                id: milestoneId,
                name: name || "",
                description: description || "",
                dueDate: dueDate || "",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("milestones/edit", { milestone, project });
            }

            const updated = await sql`
                UPDATE milestones
                SET
                    name = ${name},
                    description = ${description || null},
                    "dueDate" = ${dueDate || null},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${milestoneId} AND
                    "projectId" = ${projectId} AND
                    "orgId" = ${orgId} AND
                    "isActive" = true
                RETURNING id
            `.then(([x]) => x);

            if (!updated) {
                req.flash("error", "Milestone not found.");
                return res.redirect(`/projects/${projectId}/milestones`);
            }

            req.flash("info", "Milestone updated successfully.");
            return res.redirect(`/projects/${projectId}/milestones/${milestoneId}`);
        } catch (err) {
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p."milestonesEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${orgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            // Soft delete - set isActive to false and unassign work items
            await sql`
                UPDATE work
                SET
                    "milestoneId" = 0,
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    "milestoneId" = ${milestoneId} AND
                    "orgId" = ${orgId}
            `;

            await sql`
                UPDATE milestones
                SET
                    "isActive" = false,
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${milestoneId} AND
                    "projectId" = ${projectId} AND
                    "orgId" = ${orgId}
            `;

            req.flash("info", "Milestone deleted successfully.");
            return res.redirect(`/projects/${projectId}/milestones`);
        } catch (err) {
            next(err);
        }
    },
};
