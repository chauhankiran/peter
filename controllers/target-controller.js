const sql = require("../db/sql");
const { PER_PAGE } = require("../constants/app");
const generatePaginationLinks = require("../helpers/generate-pagination-links");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;

        const search = req.query.search || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || PER_PAGE;
        const skip = (page - 1) * limit;
        const orderBy = req.query.orderBy || "t.dueDate";
        const orderDir = req.query.orderDir || "ASC";

        const whereClauses = [];

        if (search) {
            whereClauses.push(
                sql`t.name iLIKE ${"%" + search + "%"} OR t.description iLIKE ${"%" + search + "%"}`,
            );
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        try {
            // Verify project access and targets enabled
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isTargetsEnabled"
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

            if (!project.isTargetsEnabled) {
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
                        AND m."status" = 'active'
                    ) as "totalMilestones",
                    (
                        SELECT COUNT(*) 
                        FROM milestones m 
                        WHERE m."targetId" = t.id 
                        AND m."status" = 'active'
                        AND (
                            SELECT COUNT(*) FROM works w WHERE w."milestoneId" = m.id AND w."status" = 'active'
                        ) > 0
                        AND (
                            SELECT COUNT(*) FROM works w WHERE w."milestoneId" = m.id AND w."status" = 'active'
                        ) = (
                            SELECT COUNT(*) FROM works w 
                            JOIN statuses s ON s.id = w."statusId"
                            WHERE w."milestoneId" = m.id AND w."status" = 'active' AND s."isDone" = true
                        )
                    ) as "completedMilestones"
                FROM
                    targets t
                WHERE
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    t."projectId" = ${projectId} AND
                    t."orgId" = ${orgId} AND
                    t."status" = 'active'
                ORDER BY
                    ${sql(orderBy)}
                    ${orderDir === "ASC" ? sql`ASC` : sql`DESC`}
                LIMIT
                    ${limit}
                OFFSET
                    ${skip}
            `;

            const { count } = await sql`
                SELECT
                    count(*) as count
                FROM
                    targets t
                WHERE
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    t."projectId" = ${projectId} AND
                    t."orgId" = ${orgId} AND
                    t."status" = 'active'
            `.then(([x]) => x);

            const pages = Math.ceil((+count || 0) / limit) || 1;

            const paginationLinks = generatePaginationLinks({
                link: `/projects/${projectId}/targets`,
                page,
                pages,
                search,
                limit,
                orderBy,
                orderDir,
            });

            // Calculate progress percentage for each target
            const targetsWithProgress = targets.map((t) => ({
                ...t,
                progress:
                    t.totalMilestones > 0
                        ? Math.round(
                              (t.completedMilestones / t.totalMilestones) * 100,
                          )
                        : 0,
            }));

            return res.render("targets/index", {
                targets: targetsWithProgress,
                project,
                search,
                paginationLinks,
                orderBy,
                orderDir,
                count,
            });
        } catch (err) {
            next(err);
        }
    },

    new: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isTargetsEnabled"
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

            if (!project.isTargetsEnabled) {
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
        const orgId = req.session.userOrgId;
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
                    p."isTargetsEnabled"
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

            if (!project.isTargetsEnabled) {
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
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isTargetsEnabled"
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

            if (!project.isTargetsEnabled) {
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
                        AND m."status" = 'active'
                    ) as "totalMilestones",
                    (
                        SELECT COUNT(*) 
                        FROM milestones m 
                        WHERE m."targetId" = t.id 
                        AND m."status" = 'active'
                        AND (
                            SELECT COUNT(*) FROM works w WHERE w."milestoneId" = m.id AND w."status" = 'active'
                        ) > 0
                        AND (
                            SELECT COUNT(*) FROM works w WHERE w."milestoneId" = m.id AND w."status" = 'active'
                        ) = (
                            SELECT COUNT(*) FROM works w 
                            JOIN statuses s ON s.id = w."statusId"
                            WHERE w."milestoneId" = m.id AND w."status" = 'active' AND s."isDone" = true
                        )
                    ) as "completedMilestones"
                FROM
                    targets t
                WHERE
                    t.id = ${targetId} AND
                    t."projectId" = ${projectId} AND
                    t."orgId" = ${orgId} AND
                    t."status" = 'active'
            `.then(([x]) => x);

            if (!target) {
                req.flash("error", "Target not found.");
                return res.redirect(`/projects/${projectId}/targets`);
            }

            target.progress =
                target.totalMilestones > 0
                    ? Math.round(
                          (target.completedMilestones /
                              target.totalMilestones) *
                              100,
                      )
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
                        FROM works w 
                        WHERE w."milestoneId" = m.id 
                        AND w."status" = 'active'
                    ) as "totalWork",
                    (
                        SELECT COUNT(*) 
                        FROM works w 
                        JOIN statuses s ON s.id = w."statusId"
                        WHERE w."milestoneId" = m.id 
                        AND w."status" = 'active'
                        AND s."isDone" = true
                    ) as "completedWork"
                FROM
                    milestones m
                WHERE
                    m."targetId" = ${targetId} AND
                    m."orgId" = ${orgId} AND
                    m."status" = 'active'
                ORDER BY
                    m."dueDate" ASC NULLS LAST,
                    m.name ASC
            `;

            const milestonesWithProgress = milestones.map((m) => ({
                ...m,
                progress:
                    m.totalWork > 0
                        ? Math.round((m.completedWork / m.totalWork) * 100)
                        : 0,
            }));

            return res.render("targets/show", {
                target,
                project,
                milestones: milestonesWithProgress,
            });
        } catch (err) {
            next(err);
        }
    },

    edit: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isTargetsEnabled"
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

            if (!project.isTargetsEnabled) {
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
                    t."status" = 'active'
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
        const orgId = req.session.userOrgId;
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
                    p."isTargetsEnabled"
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

            if (!project.isTargetsEnabled) {
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
                    "status" = 'active'
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
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const targetId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p."isTargetsEnabled"
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
                    "status" = 'archived',
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
