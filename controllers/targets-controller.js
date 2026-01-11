const sql = require("../db/sql");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;

        try {
            // Verify project access and targets enabled
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."targetsEnabled"
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

            if (!project.targetsEnabled) {
                req.flash("error", "Targets are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const targets = await sql`
                SELECT
                    t.id,
                    t.name,
                    t.description,
                    t."dueDate",
                    t."createdAt",
                    (
                        SELECT COUNT(*) 
                        FROM milestones m 
                        WHERE m."targetId" = t.id 
                        AND m."isActive" = true
                    ) as "totalMilestones",
                    (
                        SELECT COUNT(*) 
                        FROM milestones m 
                        WHERE m."targetId" = t.id 
                        AND m."isActive" = true
                        AND (
                            SELECT COUNT(*) FROM work w WHERE w."milestoneId" = m.id AND w."isActive" = true
                        ) > 0
                        AND (
                            SELECT COUNT(*) FROM work w WHERE w."milestoneId" = m.id AND w."isActive" = true
                        ) = (
                            SELECT COUNT(*) FROM work w 
                            JOIN statuses s ON s.id = w."statusId"
                            WHERE w."milestoneId" = m.id AND w."isActive" = true AND s."isDone" = true
                        )
                    ) as "completedMilestones"
                FROM
                    targets t
                WHERE
                    t."projectId" = ${projectId} AND
                    t."orgId" = ${orgId} AND
                    t."isActive" = true
                ORDER BY
                    t."dueDate" ASC NULLS LAST,
                    t.name ASC
            `;

            // Calculate progress percentage for each target
            const targetsWithProgress = targets.map(t => ({
                ...t,
                progress: t.totalMilestones > 0 ? Math.round((t.completedMilestones / t.totalMilestones) * 100) : 0
            }));

            return res.render("targets/index", {
                targets: targetsWithProgress,
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
                    p."targetsEnabled"
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

            if (!project.targetsEnabled) {
                req.flash("error", "Targets are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const target = {
                name: "",
                description: "",
                dueDate: "",
            };

            return res.render("targets/new", { target, project });
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
                    p."targetsEnabled"
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

            if (!project.targetsEnabled) {
                req.flash("error", "Targets are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const target = {
                name: name || "",
                description: description || "",
                dueDate: dueDate || "",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("targets/new", { target, project });
            }

            await sql`
                INSERT INTO targets (
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

            req.flash("info", "Target created successfully.");
            return res.redirect(`/projects/${projectId}/targets`);
        } catch (err) {
            next(err);
        }
    },

    show: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."targetsEnabled"
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

            if (!project.targetsEnabled) {
                req.flash("error", "Targets are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const target = await sql`
                SELECT
                    t.id,
                    t.name,
                    t.description,
                    t."dueDate",
                    t."createdAt",
                    (
                        SELECT COUNT(*) 
                        FROM milestones m 
                        WHERE m."targetId" = t.id 
                        AND m."isActive" = true
                    ) as "totalMilestones",
                    (
                        SELECT COUNT(*) 
                        FROM milestones m 
                        WHERE m."targetId" = t.id 
                        AND m."isActive" = true
                        AND (
                            SELECT COUNT(*) FROM work w WHERE w."milestoneId" = m.id AND w."isActive" = true
                        ) > 0
                        AND (
                            SELECT COUNT(*) FROM work w WHERE w."milestoneId" = m.id AND w."isActive" = true
                        ) = (
                            SELECT COUNT(*) FROM work w 
                            JOIN statuses s ON s.id = w."statusId"
                            WHERE w."milestoneId" = m.id AND w."isActive" = true AND s."isDone" = true
                        )
                    ) as "completedMilestones"
                FROM
                    targets t
                WHERE
                    t.id = ${targetId} AND
                    t."projectId" = ${projectId} AND
                    t."orgId" = ${orgId} AND
                    t."isActive" = true
            `.then(([x]) => x);

            if (!target) {
                req.flash("error", "Target not found.");
                return res.redirect(`/projects/${projectId}/targets`);
            }

            target.progress = target.totalMilestones > 0 
                ? Math.round((target.completedMilestones / target.totalMilestones) * 100) 
                : 0;

            // Get milestones in this target
            const milestones = await sql`
                SELECT
                    m.id,
                    m.name,
                    m.description,
                    m."dueDate",
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
                    m."targetId" = ${targetId} AND
                    m."orgId" = ${orgId} AND
                    m."isActive" = true
                ORDER BY
                    m."dueDate" ASC NULLS LAST,
                    m.name ASC
            `;

            const milestonesWithProgress = milestones.map(m => ({
                ...m,
                progress: m.totalWork > 0 ? Math.round((m.completedWork / m.totalWork) * 100) : 0
            }));

            return res.render("targets/show", { target, project, milestones: milestonesWithProgress });
        } catch (err) {
            next(err);
        }
    },

    edit: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."targetsEnabled"
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

            if (!project.targetsEnabled) {
                req.flash("error", "Targets are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const targetRow = await sql`
                SELECT
                    t.id,
                    t.name,
                    t.description,
                    t."dueDate"
                FROM
                    targets t
                WHERE
                    t.id = ${targetId} AND
                    t."projectId" = ${projectId} AND
                    t."orgId" = ${orgId} AND
                    t."isActive" = true
            `.then(([x]) => x);

            if (!targetRow) {
                req.flash("error", "Target not found.");
                return res.redirect(`/projects/${projectId}/targets`);
            }

            const target = {
                id: targetRow.id,
                name: targetRow.name,
                description: targetRow.description || "",
                dueDate: targetRow.dueDate || "",
            };

            return res.render("targets/edit", { target, project });
        } catch (err) {
            next(err);
        }
    },

    update: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;
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
                    p."targetsEnabled"
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

            if (!project.targetsEnabled) {
                req.flash("error", "Targets are not enabled for this project.");
                return res.redirect(`/projects/${projectId}`);
            }

            const target = {
                id: targetId,
                name: name || "",
                description: description || "",
                dueDate: dueDate || "",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("targets/edit", { target, project });
            }

            const updated = await sql`
                UPDATE targets
                SET
                    name = ${name},
                    description = ${description || null},
                    "dueDate" = ${dueDate || null},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${targetId} AND
                    "projectId" = ${projectId} AND
                    "orgId" = ${orgId} AND
                    "isActive" = true
                RETURNING id
            `.then(([x]) => x);

            if (!updated) {
                req.flash("error", "Target not found.");
                return res.redirect(`/projects/${projectId}/targets`);
            }

            req.flash("info", "Target updated successfully.");
            return res.redirect(`/projects/${projectId}/targets/${targetId}`);
        } catch (err) {
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p."targetsEnabled"
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

            // Unassign milestones from this target
            await sql`
                UPDATE milestones
                SET
                    "targetId" = 0,
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    "targetId" = ${targetId} AND
                    "orgId" = ${orgId}
            `;

            await sql`
                UPDATE targets
                SET
                    "isActive" = false,
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${targetId} AND
                    "projectId" = ${projectId} AND
                    "orgId" = ${orgId}
            `;

            req.flash("info", "Target deleted successfully.");
            return res.redirect(`/projects/${projectId}/targets`);
        } catch (err) {
            next(err);
        }
    },
};
