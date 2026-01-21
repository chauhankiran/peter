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
        const orderBy = req.query.orderBy || "m.dueDate";
        const orderDir = req.query.orderDir || "ASC";

        const whereClauses = [];

        if (search) {
            whereClauses.push(
                sql`m.name iLIKE ${"%" + search + "%"} OR m.description iLIKE ${"%" + search + "%"}`,
            );
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        try {
            // Verify project access and milestones enabled
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isMilestonesEnabled"
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

            if (!project.isMilestonesEnabled) {
                req.flash(
                    "error",
                    "Milestones are not enabled for this project.",
                );
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
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."status" = 'active'
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
                    milestones m
                WHERE
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."status" = 'active'
            `.then(([x]) => x);

            const pages = Math.ceil((+count || 0) / limit) || 1;

            const paginationLinks = generatePaginationLinks({
                link: `/projects/${projectId}/milestones`,
                page,
                pages,
                search,
                limit,
                orderBy,
                orderDir,
            });

            // Calculate progress percentage for each milestone
            const milestonesWithProgress = milestones.map((m) => ({
                ...m,
                progress:
                    m.totalWork > 0
                        ? Math.round((m.completedWork / m.totalWork) * 100)
                        : 0,
            }));

            return res.render("milestones/index", {
                milestones: milestonesWithProgress,
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
                    p."isMilestonesEnabled",
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

            if (!project.isMilestonesEnabled) {
                req.flash(
                    "error",
                    "Milestones are not enabled for this project.",
                );
                return res.redirect(`/projects/${projectId}`);
            }

            const targets = project.targetsEnabled
                ? await sql`
                      SELECT
                          t.id,
                          t.name
                      FROM
                          targets t
                      WHERE
                          t."orgId" = ${orgId} AND
                          t."projectId" = ${projectId} AND
                          t."status" = 'active'
                      ORDER BY
                          t.name ASC
                  `
                : [];

            const milestone = {
                name: "",
                description: "",
                dueDate: "",
            };

            return res.render("milestones/new", {
                milestone,
                project,
                targets,
                selectedTargetId: "",
            });
        } catch (err) {
            next(err);
        }
    },

    create: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const { name, description, dueDate, targetId } = req.body;

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
                    p."isMilestonesEnabled"
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

            if (!project.isMilestonesEnabled) {
                req.flash(
                    "error",
                    "Milestones are not enabled for this project.",
                );
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
                    "targetId",
                    "createdBy"
                ) VALUES (
                    ${orgId},
                    ${projectId},
                    ${name},
                    ${description || null},
                    ${dueDate || null},
                    ${targetId || 0},
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
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isMilestonesEnabled"
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

            if (!project.isMilestonesEnabled) {
                req.flash(
                    "error",
                    "Milestones are not enabled for this project.",
                );
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
                    m.id = ${milestoneId} AND
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."status" = 'active'
            `.then(([x]) => x);

            if (!milestone) {
                req.flash("error", "Milestone not found.");
                return res.redirect(`/projects/${projectId}/milestones`);
            }

            milestone.progress =
                milestone.totalWork > 0
                    ? Math.round(
                          (milestone.completedWork / milestone.totalWork) * 100,
                      )
                    : 0;

            // Get work items in this milestone
            const workItems = await sql`
                SELECT
                    w.id,
                    w.title,
                    s.name as "statusName",
                    s."isDone",
                    pr.name as "priorityName"
                FROM
                    works w
                JOIN
                    statuses s ON s.id = w."statusId"
                JOIN
                    priorities pr ON pr.id = w."priorityId"
                JOIN
                    projects p ON p.id = w."projectId"
                WHERE
                    w."milestoneId" = ${milestoneId} AND
                    w."orgId" = ${orgId} AND
                    w."status" = 'active'
                ORDER BY
                    s."isDone" ASC,
                    w.id DESC
            `;

            return res.render("milestones/show", {
                milestone,
                project,
                workItems,
            });
        } catch (err) {
            next(err);
        }
    },

    edit: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."isMilestonesEnabled",
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

            if (!project.isMilestonesEnabled) {
                req.flash(
                    "error",
                    "Milestones are not enabled for this project.",
                );
                return res.redirect(`/projects/${projectId}`);
            }

            const milestoneRow = await sql`
                SELECT
                    m.id,
                    m.name,
                    m.description,
                    m."dueDate",
                    m."targetId"
                FROM
                    milestones m
                WHERE
                    m.id = ${milestoneId} AND
                    m."projectId" = ${projectId} AND
                    m."orgId" = ${orgId} AND
                    m."status" = 'active'
            `.then(([x]) => x);

            if (!milestoneRow) {
                req.flash("error", "Milestone not found.");
                return res.redirect(`/projects/${projectId}/milestones`);
            }

            const targets = project.targetsEnabled
                ? await sql`
                      SELECT
                          t.id,
                          t.name
                      FROM
                          targets t
                      WHERE
                          t."orgId" = ${orgId} AND
                          t."projectId" = ${projectId} AND
                          t."status" = 'active'
                      ORDER BY
                          t.name ASC
                  `
                : [];

            const milestone = {
                id: milestoneRow.id,
                name: milestoneRow.name,
                description: milestoneRow.description || "",
                dueDate: milestoneRow.dueDate || "",
            };

            return res.render("milestones/edit", {
                milestone,
                project,
                targets,
                selectedTargetId: milestoneRow.targetId || "",
            });
        } catch (err) {
            next(err);
        }
    },

    update: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;
        const { name, description, dueDate, targetId } = req.body;

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
                    p."isMilestonesEnabled"
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

            if (!project.isMilestonesEnabled) {
                req.flash(
                    "error",
                    "Milestones are not enabled for this project.",
                );
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
                    "targetId" = ${targetId || 0},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${milestoneId} AND
                    "projectId" = ${projectId} AND
                    "orgId" = ${orgId} AND
                    "status" = 'active'
                RETURNING id
            `.then(([x]) => x);

            if (!updated) {
                req.flash("error", "Milestone not found.");
                return res.redirect(`/projects/${projectId}/milestones`);
            }

            req.flash("info", "Milestone updated successfully.");
            return res.redirect(
                `/projects/${projectId}/milestones/${milestoneId}`,
            );
        } catch (err) {
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const projectId = req.params.projectId;
        const milestoneId = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p."isMilestonesEnabled"
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
                UPDATE works
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
                    "status" = 'archived',
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
