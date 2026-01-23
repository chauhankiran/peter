const sql = require("../db/sql");
const { PER_PAGE } = require("../constants/app");
const generatePaginationLinks = require("../helpers/generate-pagination-links");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;

        const search = req.query.search || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || PER_PAGE;
        const skip = (page - 1) * limit;
        const orderBy = req.query.orderBy || "id";
        const orderDir = req.query.orderDir || "DESC";

        const whereClauses = [];

        if (search) {
            whereClauses.push(
                sql`w.title iLIKE ${"%" + search + "%"} OR p.name iLIKE ${"%" + search + "%"}`,
            );
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        try {
            const workItems = await sql`
                SELECT
                    w.id,
                    w.title,
                    s.name as "statusName",
                    pr.name as "priorityName",
                    p.id as "projectId",
                    p.name as "projectName",
                    u.name as "assigneeName"
                FROM
                    "works" w
                JOIN
                    projects p
                ON
                    p.id = w."projectId"
                JOIN
                    "statuses" s
                ON
                    s.id = w."statusId"
                JOIN
                    "priorities" pr
                ON
                    pr.id = w."priorityId"
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                LEFT JOIN
                    users u
                ON
                    u.id = w."assigneeId"
                WHERE
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    w."orgId" = ${orgId} AND
                    w."status" = 'active' AND
                    p."status" = 'active'
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
                    count(DISTINCT w.id)
                FROM
                    "works" w
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
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    w."orgId" = ${orgId} AND
                    w."status" = 'active' AND
                    p."status" = 'active'
            `.then(([x]) => x);

            const pages = Math.ceil((+count || 0) / limit) || 1;

            const paginationLinks = generatePaginationLinks({
                link: "/work",
                page,
                pages,
                search,
                limit,
                orderBy,
                orderDir,
            });

            console.log("count: ", count);

            return res.render("work/index", {
                workItems,
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

    partialPriorities: async (req, res, next) => {
        const projectId = req.query.projectId;
        const selectedPriorityId = req.query.priorityId || "";

        if (!projectId) {
            return res.render("work/partials/priority-select", {
                priorities: [],
                selectedPriorityId,
            });
        }

        try {
            const projectAccess = await sql`
                SELECT
                    p.id
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!projectAccess) {
                return res.render("work/partials/priority-select", {
                    priorities: [],
                    selectedPriorityId,
                });
            }

            const priorities = await sql`
                SELECT
                    pr.id,
                    pr.name,
                    pr.sequence
                FROM
                    "priorities" pr
                WHERE
                    pr."orgId" = ${req.session.userOrgId} AND
                    pr."projectId" = ${projectId}
                ORDER BY
                    pr.sequence DESC
            `;

            return res.render("work/partials/priority-select", {
                priorities,
                selectedPriorityId,
            });
        } catch (err) {
            next(err);
        }
    },

    partialStatuses: async (req, res, next) => {
        const projectId = req.query.projectId;
        const selectedStatusId = req.query.statusId || "";

        if (!projectId) {
            return res.render("work/partials/status-select", {
                statuses: [],
                selectedStatusId,
            });
        }

        try {
            const projectAccess = await sql`
                SELECT
                    p.id
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!projectAccess) {
                return res.render("work/partials/status-select", {
                    statuses: [],
                    selectedStatusId,
                });
            }

            const statuses = await sql`
                SELECT
                    s.id,
                    s.name,
                    s.sequence,
                    s."isDone"
                FROM
                    "statuses" s
                WHERE
                    s."orgId" = ${req.session.userOrgId} AND
                    s."projectId" = ${projectId}
                ORDER BY
                    s.sequence DESC
            `;

            return res.render("work/partials/status-select", {
                statuses,
                selectedStatusId,
            });
        } catch (err) {
            next(err);
        }
    },

    partialAssignees: async (req, res, next) => {
        const projectId = req.query.projectId;
        const assigneeId = req.query.assigneeId || "";

        if (!projectId) {
            return res.render("work/partials/assignee-select", {
                assignees: [],
                assigneeId,
            });
        }

        try {
            const projectAccess = await sql`
                SELECT
                    p.id
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!projectAccess) {
                return res.render("work/partials/assignee-select", {
                    assignees: [],
                    assigneeId,
                });
            }

            const assignees = await sql`
                SELECT
                    u.id,
                    u.name,
                    u.email
                FROM
                    "projectMembers" pm
                JOIN
                    users u
                ON
                    u.id = pm."userId"
                WHERE
                    pm."projectId" = ${projectId}
                ORDER BY
                    u.name ASC
            `;

            return res.render("work/partials/assignee-select", {
                assignees,
                assigneeId,
            });
        } catch (err) {
            next(err);
        }
    },

    new: async (req, res, next) => {
        const projectId = req.query.projectId;

        try {
            const projects = await sql`
                SELECT
                    p.id,
                    p.name
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
                ORDER BY
                    p.name ASC
            `;

            const canUseProjectFromQuery =
                !!projectId &&
                projects.some((p) => String(p.id) === String(projectId));

            const selectedProjectId = canUseProjectFromQuery ? projectId : "";
            const projectLocked = canUseProjectFromQuery;

            const assignees = selectedProjectId
                ? await sql`
                      SELECT
                          u.id,
                          u.name,
                          u.email
                      FROM
                          "projectMembers" pm
                      JOIN
                          users u
                      ON
                          u.id = pm."userId"
                      WHERE
                          pm."projectId" = ${selectedProjectId}
                      ORDER BY
                          u.name ASC
                  `
                : await sql`
                      SELECT
                          u.id,
                          u.name,
                          u.email
                      FROM
                          "userOrgs" uo
                      JOIN
                          users u
                      ON
                          u.id = uo."userId"
                      WHERE
                          uo."orgId" = ${req.session.userOrgId} AND
                          uo."isActive" = true
                      ORDER BY
                          u.name ASC
                  `;

            const statuses = selectedProjectId
                ? await sql`
                      SELECT
                          s.id,
                          s.name,
                          s.sequence,
                          s."isDone"
                      FROM
                          "statuses" s
                      WHERE
                          s."orgId" = ${req.session.userOrgId} AND
                          s."projectId" = ${selectedProjectId}
                      ORDER BY
                          s.sequence ASC
                  `
                : [];

            const defaultStatusId = statuses.length > 0 ? statuses[0].id : "";

            const priorities = selectedProjectId
                ? await sql`
                      SELECT
                          pr.id,
                          pr.name,
                          pr.sequence
                      FROM
                          "priorities" pr
                      WHERE
                          pr."orgId" = ${req.session.userOrgId} AND
                          pr."projectId" = ${selectedProjectId}
                      ORDER BY
                          pr.sequence ASC
                  `
                : [];

            const defaultPriorityId =
                priorities.length > 0 ? priorities[0].id : "";

            // Fetch milestones if project has them enabled
            const milestones = selectedProjectId
                ? await sql`
                      SELECT
                          m.id,
                          m.name
                      FROM
                          milestones m
                      JOIN
                          projects p
                      ON
                          p.id = m."projectId"
                      WHERE
                          m."orgId" = ${req.session.userOrgId} AND
                          m."projectId" = ${selectedProjectId} AND
                          m."status" = 'active' AND
                          p."isMilestonesEnabled" = true
                      ORDER BY
                          m.name ASC
                  `
                : [];

            const work = {
                projectId: selectedProjectId,
                title: "",
                description: "",
                assigneeId: "",
                statusId: defaultStatusId,
                priorityId: defaultPriorityId,
                dueDate: "",
            };

            return res.render("work/new", {
                work,
                projects,
                assignees,
                statuses,
                priorities,
                milestones,
                selectedMilestoneId: "",
                projectLocked,
            });
        } catch (err) {
            next(err);
        }
    },

    create: async (req, res, next) => {
        const {
            projectId,
            title,
            description,
            assigneeId,
            statusId,
            priorityId,
            milestoneId,
            dueDate,
            projectLocked,
        } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!projectId) {
            errors.push("Project is required.");
            validationFailed = true;
        }

        if (!title) {
            errors.push("Title is required.");
            validationFailed = true;
        }

        try {
            const projects = await sql`
                SELECT
                    p.id,
                    p.name
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
                ORDER BY
                    p.name ASC
            `;

            const assignees = await sql`
                SELECT
                    u.id,
                    u.name,
                    u.email
                FROM
                    "userOrgs" uo
                JOIN
                    users u
                ON
                    u.id = uo."userId"
                WHERE
                    uo."orgId" = ${req.session.userOrgId} AND
                    uo."isActive" = true
                ORDER BY
                    u.name ASC
            `;

            const work = {
                projectId: projectId || "",
                title: title || "",
                description: description || "",
                assigneeId: assigneeId || "",
                statusId: statusId || "",
                priorityId: priorityId || "",
                dueDate: dueDate || "",
            };

            const statuses = projectId
                ? await sql`
                      SELECT
                          s.id,
                          s.name,
                          s.sequence,
                          s."isDone"
                      FROM
                          "statuses" s
                      WHERE
                          s."orgId" = ${req.session.userOrgId} AND
                          s."projectId" = ${projectId}
                      ORDER BY
                          s.sequence ASC
                  `
                : [];

            const effectiveStatusId =
                statusId || (statuses.length > 0 ? statuses[0].id : "");

            work.statusId = effectiveStatusId;

            const priorities = projectId
                ? await sql`
                      SELECT
                          pr.id,
                          pr.name,
                          pr.sequence
                      FROM
                          "priorities" pr
                      WHERE
                          pr."orgId" = ${req.session.userOrgId} AND
                          pr."projectId" = ${projectId}
                      ORDER BY
                          pr.sequence ASC
                  `
                : [];

            const effectivePriorityId =
                priorityId || (priorities.length > 0 ? priorities[0].id : "");

            work.priorityId = effectivePriorityId;

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("work/new", {
                    work,
                    projects,
                    assignees,
                    statuses,
                    priorities,
                    projectLocked: !!projectLocked,
                });
            }

            const projectAccess = await sql`
                SELECT
                    p.id
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!projectAccess) {
                res.locals.errors = ["Project not found."];
                return res.render("work/new", {
                    work,
                    projects,
                    assignees,
                    statuses,
                    priorities,
                    projectLocked: !!projectLocked,
                });
            }

            const statusAccess = await sql`
                SELECT
                    s.id
                FROM
                    "statuses" s
                WHERE
                    s.id = ${effectiveStatusId} AND
                    s."orgId" = ${req.session.userOrgId} AND
                    s."projectId" = ${projectId}
            `.then(([x]) => x);

            if (!statusAccess) {
                res.locals.errors = ["Status is invalid."];
                return res.render("work/new", {
                    work,
                    projects,
                    assignees,
                    statuses,
                    priorities,
                    projectLocked: !!projectLocked,
                });
            }

            const priorityAccess = await sql`
                SELECT
                    pr.id
                FROM
                    "priorities" pr
                WHERE
                    pr.id = ${effectivePriorityId} AND
                    pr."orgId" = ${req.session.userOrgId} AND
                    pr."projectId" = ${projectId}
            `.then(([x]) => x);

            if (!priorityAccess) {
                res.locals.errors = ["Priority is invalid."];
                return res.render("work/new", {
                    work,
                    projects,
                    assignees,
                    statuses,
                    priorities,
                    projectLocked: !!projectLocked,
                });
            }

            const assignedTo = assigneeId || req.session.userId;

            await sql`
                INSERT INTO "work" (
                    "orgId",
                    "projectId",
                    title,
                    description,
                    "priorityId",
                    "milestoneId",
                    "targetId",
                    "statusId",
                    "assigneeId",
                    "reporterId",
                    "dueDate",
                    "createdBy"
                ) VALUES (
                    ${req.session.userOrgId},
                    ${projectId},
                    ${title},
                    ${description || ""},
                    ${effectivePriorityId},
                    ${milestoneId || 0},
                    1,
                    ${effectiveStatusId},
                    ${assignedTo},
                    ${req.session.userId},
                    ${dueDate ? dueDate : null},
                    ${req.session.userId}
                )
            `;

            req.flash("info", "Work created successfully.");
            return res.redirect("/work");
        } catch (err) {
            next(err);
        }
    },

    show: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const workId = req.params.id;

        try {
            const work = await sql`
                SELECT
                    w.id,
                    w.title,
                    w.description,
                    w."dueDate",
                    pr.name as "priorityName",
                    w."assigneeId",
                    w."reporterId",
                    s.name as "statusName",
                    p.id as "projectId",
                    p.name as "projectName",
                    au.name as "assigneeName",
                    ru.name as "reporterName",
                    cu.name as "createdByName",
                    uu.name as "updatedByName",
                    w."createdAt",
                    w."updatedAt"
                FROM
                    "works" w
                JOIN
                    projects p
                ON
                    p.id = w."projectId"
                JOIN
                    "statuses" s
                ON
                    s.id = w."statusId"
                JOIN
                    "priorities" pr
                ON
                    pr.id = w."priorityId"
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${userId}
                LEFT JOIN
                    users au
                ON
                    au.id = w."assigneeId"
                LEFT JOIN
                    users ru
                ON
                    ru.id = w."reporterId"
                LEFT JOIN
                    users cu
                ON
                    w."createdBy" = cu.id
                LEFT JOIN
                    users uu
                ON
                    w."updatedBy" = uu.id
                WHERE
                    w.id = ${workId} AND
                    w."orgId" = ${orgId} AND
                    w."status" = 'active' AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!work) {
                const err = {
                    code: 404,
                    message: "Work not found.",
                };
                return res.status(404).render("error", { err });
            }

            const comments = await sql`
                SELECT
                    c.id,
                    c.body,
                    c."userId",
                    c."createdAt",
                    c."updatedAt",
                    u.name
                FROM
                    "comments" c
                JOIN
                    users u
                ON
                    u.id = c."userId"
                WHERE
                    c."workId" = ${workId} AND
                    c."orgId" = ${orgId} AND
                    c."isActive" = true
                ORDER BY
                    c."createdAt" ASC
            `;

            const attachments = await sql`
                SELECT
                    a.id,
                    a."originalName",
                    a."fileSize",
                    a."mimeType",
                    a."userId",
                    a."createdAt",
                    u.name
                FROM
                    "attachments" a
                JOIN
                    users u
                ON
                    u.id = a."userId"
                WHERE
                    a."workId" = ${workId} AND
                    a."orgId" = ${orgId} AND
                    a."isActive" = true
                ORDER BY
                    a."createdAt" DESC
            `;

            return res.render("work/show", { work, comments, attachments });
        } catch (err) {
            next(err);
        }
    },

    edit: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const workId = req.params.id;

        try {
            const workRow = await sql`
                SELECT
                    w.id,
                    w."projectId",
                    p.name as "projectName",
                    p."isMilestonesEnabled",
                    w.title,
                    w.description,
                    w."assigneeId",
                    w."dueDate",
                    w."priorityId",
                    w."statusId",
                    w."milestoneId"
                FROM
                    "works" w
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
                    w."status" = 'active' AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!workRow) {
                const err = {
                    code: 404,
                    message: "Work not found.",
                };
                return res.status(404).render("error", { err });
            }

            const projects = await sql`
                SELECT
                    p.id,
                    p.name
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

            const assignees = await sql`
                SELECT
                    u.id,
                    u.name,
                    u.email
                FROM
                    "projectMembers" pm
                JOIN
                    users u
                ON
                    u.id = pm."userId"
                WHERE
                    pm."projectId" = ${workRow.projectId}
                ORDER BY
                    u.name ASC
            `;

            const statuses = await sql`
                SELECT
                    s.id,
                    s.name,
                    s.sequence,
                    s."isDone"
                FROM
                    "statuses" s
                WHERE
                    s."orgId" = ${orgId} AND
                    s."projectId" = ${workRow.projectId}
                ORDER BY
                    s.sequence DESC
            `;

            const work = {
                id: workRow.id,
                projectId: workRow.projectId,
                title: workRow.title,
                description: workRow.description,
                assigneeId: workRow.assigneeId,
                statusId: workRow.statusId,
                priorityId: workRow.priorityId,
                milestoneId: workRow.milestoneId,
                dueDate: workRow.dueDate
                    ? new Date(workRow.dueDate).toISOString().slice(0, 10)
                    : "",
            };

            const priorities = await sql`
                SELECT
                    pr.id,
                    pr.name,
                    pr.sequence
                FROM
                    "priorities" pr
                WHERE
                    pr."orgId" = ${orgId} AND
                    pr."projectId" = ${workRow.projectId}
                ORDER BY
                    pr.sequence DESC
            `;

            const milestones = workRow.milestonesEnabled
                ? await sql`
                      SELECT
                          m.id,
                          m.name
                      FROM
                          milestones m
                      WHERE
                          m."orgId" = ${orgId} AND
                          m."projectId" = ${workRow.projectId} AND
                          m."isActive" = true
                      ORDER BY
                          m.name ASC
                  `
                : [];

            return res.render("work/edit", {
                work,
                projects,
                assignees,
                statuses,
                priorities,
                milestones,
                selectedMilestoneId: workRow.milestoneId || "",
                projectLocked: true,
            });
        } catch (err) {
            next(err);
        }
    },

    update: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const workId = req.params.id;

        const {
            title,
            description,
            assigneeId,
            priorityId,
            milestoneId,
            dueDate,
            statusId,
        } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!title) {
            errors.push("Title is required.");
            validationFailed = true;
        }

        try {
            const existingWork = await sql`
                SELECT
                    w.id,
                    w."projectId",
                    w."priorityId",
                    w."statusId"
                FROM
                    "works" w
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
                    w."status" = 'active' AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!existingWork) {
                const err = {
                    code: 404,
                    message: "Work not found.",
                };
                return res.status(404).render("error", { err });
            }

            const projects = await sql`
                SELECT
                    p.id,
                    p.name
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

            const assignees = await sql`
                SELECT
                    u.id,
                    u.name,
                    u.email
                FROM
                    "projectMembers" pm
                JOIN
                    users u
                ON
                    u.id = pm."userId"
                WHERE
                    pm."projectId" = ${existingWork.projectId}
                ORDER BY
                    u.name ASC
            `;

            const statuses = await sql`
                SELECT
                    s.id,
                    s.name,
                    s.sequence,
                    s."isDone"
                FROM
                    "statuses" s
                WHERE
                    s."orgId" = ${orgId} AND
                    s."projectId" = ${existingWork.projectId}
                ORDER BY
                    s.sequence DESC
            `;

            const effectiveStatusId = statusId || existingWork.statusId;

            const isStatusValid = statuses.some(
                (s) => String(s.id) === String(effectiveStatusId),
            );

            if (!isStatusValid) {
                errors.push("Status is invalid.");
                validationFailed = true;
            }

            const priorities = await sql`
                SELECT
                    pr.id,
                    pr.name,
                    pr.sequence
                FROM
                    "priorities" pr
                WHERE
                    pr."orgId" = ${orgId} AND
                    pr."projectId" = ${existingWork.projectId}
                ORDER BY
                    pr.sequence DESC
            `;

            const effectivePriorityId =
                priorityId ||
                existingWork.priorityId ||
                (priorities[0] ? priorities[0].id : "");

            const isPriorityValid = priorities.some(
                (p) => String(p.id) === String(effectivePriorityId),
            );

            if (!isPriorityValid) {
                errors.push("Priority is invalid.");
                validationFailed = true;
            }
            const assignedTo = assigneeId || userId;
            const isAssigneeValid = assignees.some(
                (a) => String(a.id) === String(assignedTo),
            );

            if (!isAssigneeValid) {
                errors.push("Assignee is not a member of this project.");
                validationFailed = true;
            }

            const work = {
                id: workId,
                projectId: existingWork.projectId,
                title: title || "",
                description: description || "",
                assigneeId: assignedTo,
                statusId: effectiveStatusId,
                priorityId: effectivePriorityId,
                dueDate: dueDate || "",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("work/edit", {
                    work,
                    projects,
                    assignees,
                    statuses,
                    priorities,
                    projectLocked: true,
                });
            }

            await sql`
                UPDATE
                    "work"
                SET
                    title = ${title},
                    description = ${description || ""},
                    "assigneeId" = ${assignedTo},
                    "priorityId" = ${effectivePriorityId},
                    "statusId" = ${effectiveStatusId},
                    "milestoneId" = ${milestoneId || 0},
                    "dueDate" = ${dueDate ? dueDate : null},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${workId} AND
                    "orgId" = ${orgId}
            `;

            req.flash("info", "Work updated successfully.");
            return res.redirect(`/work/${workId}`);
        } catch (err) {
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const orgId = req.session.userOrgId;
        const userId = req.session.userId;
        const workId = req.params.id;

        try {
            const workAccess = await sql`
                SELECT
                    w.id
                FROM
                    "works" w
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
                    w."status" = 'active' AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!workAccess) {
                const err = {
                    code: 404,
                    message: "Work not found.",
                };
                return res.status(404).render("error", { err });
            }

            await sql`
                UPDATE
                    "work"
                SET
                    "isActive" = false,
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${workId} AND
                    "orgId" = ${orgId}
            `;

            req.flash("info", "Work deleted successfully.");
            return res.redirect("/work");
        } catch (err) {
            next(err);
        }
    },

    partialMilestones: async (req, res, next) => {
        const projectId = req.query.projectId;
        const selectedMilestoneId = req.query.milestoneId || "";

        if (!projectId) {
            return res.render("work/partials/milestone-select", {
                milestones: [],
                selectedMilestoneId,
            });
        }

        try {
            const projectAccess = await sql`
                SELECT
                    p.id
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${projectId} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!projectAccess) {
                return res.render("work/partials/milestone-select", {
                    milestones: [],
                    selectedMilestoneId,
                });
            }

            const milestones = await sql`
                SELECT
                    m.id,
                    m.name,
                    m."dueDate"
                FROM
                    milestones m
                WHERE
                    m."orgId" = ${req.session.userOrgId} AND
                    m."projectId" = ${projectId}
                ORDER BY
                    m."dueDate" ASC
            `;

            return res.render("work/partials/milestone-select", {
                milestones,
                selectedMilestoneId,
            });
        } catch (err) {
            next(err);
        }
    },
};
