const sql = require("../db/sql");
const { PER_PAGE, views } = require("../constants/app");
const generatePaginationLinks = require("../helpers/generate-pagination-links");
const cipher = require("../helpers/cipher");
const projectService = require("../services/project-service");
const workService = require("../services/work-service");

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

        try {
            const projects = await projectService.find({
                search,
                limit,
                skip,
                orderBy,
                orderDir,
                orgId,
                userId,
            });
            const { count } = await projectService.count({
                search,
                orgId,
                userId,
            });

            const pages = Math.ceil(count / limit);

            const paginationLinks = generatePaginationLinks({
                link: "/projects",
                page,
                pages,
                search,
                limit,
                orderBy,
                orderDir,
            });

            return res.render(views.allProjectsPath, {
                title: "Projects",
                projects,
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

    manage: async (req, res, next) => {
        const id = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id,
                    p.name,
                    p."dueDate",
                    p.description,
                    p."status",
                    p."isMilestonesEnabled",
                    p."isTargetsEnabled"
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${id} AND
                    p."orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            const membership = await sql`
                SELECT
                    pm.role
                FROM
                    "projectMembers" pm
                WHERE
                    pm."projectId" = ${id} AND
                    pm."userId" = ${req.session.userId}
            `.then(([x]) => x);

            const isOrgAdmin =
                req.session.role === "admin" || req.session.role === "owner";
            const isProjectAdmin = membership && membership.role === "admin";

            if (!isOrgAdmin && !isProjectAdmin) {
                const err = {
                    code: 404,
                    message:
                        "Either you don’t have permission to view this page, or this page doesn’t exist.",
                };
                return res.status(err.code).render("error", { err });
            }

            // Get all project members.
            const projectMembers = await projectService.getMembers({
                projectId: id,
                orgId: req.session.userOrgId,
            });

            return res.render("projects/manage", { project, projectMembers });
        } catch (err) {
            next(err);
        }
    },

    updateManage: async (req, res, next) => {
        const id = req.params.id;
        const {
            name,
            dueDate,
            description,
            status,
            isMilestonesEnabled,
            isTargetsEnabled,
        } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        const allowedStatuses = ["active", "archived", "completed"];
        if (status && !allowedStatuses.includes(status)) {
            errors.push("Status is invalid.");
            validationFailed = true;
        }

        try {
            const membership = await sql`
                SELECT
                    pm.role
                FROM
                    "projectMembers" pm
                JOIN
                    projects p
                ON
                    p.id = pm."projectId"
                WHERE
                    pm."projectId" = ${id} AND
                    pm."userId" = ${req.session.userId} AND
                    p."orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            const isOrgAdmin =
                req.session.role === "admin" || req.session.role === "owner";
            const isProjectAdmin = membership && membership.role === "admin";

            if (!isOrgAdmin && !isProjectAdmin) {
                const err = {
                    code: 404,
                    message:
                        "Either you don’t have permission to view this page, or this page doesn’t exist.",
                };
                return res.status(err.code).render("error", { err });
            }

            const project = {
                id,
                name: name || "",
                dueDate: dueDate || "",
                description: description || "",
                status: status || "active",
                isMilestonesEnabled: isMilestonesEnabled === "true",
                isTargetsEnabled: isTargetsEnabled === "true",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render("projects/manage", { project });
            }

            console.log("isMilestonesEnabled: ", isMilestonesEnabled);

            const updated = await sql`
                UPDATE
                    projects
                SET
                    name = ${name},
                    "dueDate" = ${dueDate || null},
                    description = ${description || null},
                    "status" = ${status || "active"},
                    "isMilestonesEnabled" = ${isMilestonesEnabled === "true"},
                    "isTargetsEnabled" = ${isTargetsEnabled === "true"},
                    "updatedAt" = ${sql`now()`},
                    "updatedBy" = ${req.session.userId}
                WHERE
                    id = ${id} AND
                    "orgId" = ${req.session.userOrgId}
                RETURNING id
            `.then(([x]) => x);

            if (!updated) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            req.flash("info", "Project updated successfully.");
            return res.redirect(`/projects/${id}`);
        } catch (err) {
            next(err);
        }
    },

    new: (req, res) => {
        const project = {}; // Needed for form.pug to work.
        return res.render(views.newProjectPath, {
            project,
            title: "New project",
        });
    },

    create: async (req, res, next) => {
        let { name, dueDate, description } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;

            const project = {
                name,
                dueDate,
                description,
            };
            res.render(views.newProjectPath, { project, title: "New project" });
            return;
        }

        try {
            // Use transaction to ensure data integrity.
            // For both - creation of the project and
            // adding the creator as a admin of the project.
            await sql.begin(async (sql) => {
                // Create a new project.
                const project = await sql`
                    INSERT INTO projects (
                        name, 
                        "dueDate", 
                        description,
                        "orgId", 
                        "createdBy"
                    ) VALUES (
                        ${name}, 
                        ${dueDate || null}, 
                        ${description || null},
                        ${req.session.userOrgId}, 
                        ${req.session.userId}
                    ) returning id
                `.then(([x]) => x);

                // Add user as a admin of the project.
                await sql`
                    INSERT INTO "projectMembers" (
                        "projectId", 
                        "userId", 
                        role
                    ) VALUES (
                        ${project.id}, 
                        ${req.session.userId}, 
                        'admin'
                    )
                `.then(([x]) => x);

                await sql`
                    INSERT INTO "statuses" ("orgId", "projectId", name, sequence, "isDone", "createdBy")
                    VALUES
                        (${req.session.userOrgId}, ${project.id}, 'To do', 10, false, ${req.session.userId}),
                        (${req.session.userOrgId}, ${project.id}, 'In progress', 20, false, ${req.session.userId}),
                        (${req.session.userOrgId}, ${project.id}, 'Done', 30, true, ${req.session.userId})
                `;

                await sql`
                    INSERT INTO "priorities" ("orgId", "projectId", name, sequence, "createdBy")
                    VALUES
                        (${req.session.userOrgId}, ${project.id}, 'Low', 10, ${req.session.userId}),
                        (${req.session.userOrgId}, ${project.id}, 'Normal', 20, ${req.session.userId}),
                        (${req.session.userOrgId}, ${project.id}, 'High', 30, ${req.session.userId}),
                        (${req.session.userOrgId}, ${project.id}, 'Urgent', 40, ${req.session.userId})
                `;
            });

            req.flash("info", "Project created successfully.");
            res.redirect("/projects");
        } catch (err) {
            next(err);
        }
    },

    show: async (req, res, next) => {
        const id = req.params.id;

        try {
            const project = await sql`
                SELECT
                    p.id, 
                    p.name, 
                    p."dueDate", 
                    p.description,
                    p."createdAt",
                    p."updatedAt",
                    p."isMilestonesEnabled",
                    p."isTargetsEnabled",
                    u.name,
                    uu.name as "updatedByName"
                FROM 
                    projects p
                JOIN
                    "projectMembers" pm
                ON 
                    pm."projectId" = p.id AND 
                    pm."userId" = ${req.session.userId}
                LEFT JOIN
                    users u
                ON
                    p."createdBy" = u.id
                LEFT JOIN
                    users uu
                ON
                    p."updatedBy" = uu.id
                WHERE 
                    p.id = ${id} AND 
                    p."orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            const workItems = await sql`
                SELECT
                    w.id,
                    w.title,
                    w."dueDate",
                    w."completedAt",
                    s.name as "statusName",
                    pr.name as "priorityName",
                    u.name as "assigneeName"
                FROM
                    "works" w
                JOIN
                    "statuses" s
                ON
                    s.id = w."statusId"
                JOIN
                    "priorities" pr
                ON
                    pr.id = w."priorityId"
                LEFT JOIN
                    users u
                ON
                    u.id = w."assigneeId"
                WHERE
                    w."orgId" = ${req.session.userOrgId} AND
                    w."projectId" = ${id} AND
                    w."status" = 'active'
                ORDER BY
                    w.id DESC
                LIMIT
                    3
            `;

            const { count: workCount } = await workService.getWorkCount({
                projectId: id,
                orgId: req.session.userOrgId,
            });

            return res.render(views.showProjectPath, {
                project,

                workItems,
                workCount: +workCount || 0,
            });
        } catch (err) {
            next(err);
        }
    },

    edit: async (req, res, next) => {
        const id = req.params.id;

        try {
            const membership = await sql`
                SELECT
                    pm.role
                FROM
                    "projectMembers" pm
                JOIN
                    projects p
                ON
                    p.id = pm."projectId"
                WHERE
                    pm."projectId" = ${id} AND
                    pm."userId" = ${req.session.userId} AND
                    p."orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            const isOrgAdmin =
                req.session.role === "admin" || req.session.role === "owner";
            const isProjectAdmin = membership && membership.role === "admin";

            if (!isOrgAdmin && !isProjectAdmin) {
                const err = {
                    code: 404,
                    message:
                        "Either you don’t have permission to view this page, or this page doesn’t exist.",
                };
                return res.status(err.code).render("error", { err });
            }

            const project = await sql`
                SELECT
                    p.id, 
                    p.name, 
                    p."dueDate", 
                    p.description
                FROM 
                    projects p
                JOIN
                    "projectMembers" pm
                ON 
                    pm."projectId" = p.id AND 
                    pm."userId" = ${req.session.userId}
                WHERE 
                    p.id = ${id} AND 
                    p."orgId" = ${req.session.userOrgId} AND 
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            return res.render(views.editProjectPath, { project });
        } catch (err) {
            next(err);
        }
    },

    update: async (req, res, next) => {
        const id = req.params.id;
        const { name, dueDate, description } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;

            const project = {
                name,
                dueDate,
                description,
            };
            return res.render(views.editProjectPath, { project });
        }

        try {
            const membership = await sql`
                SELECT
                    pm.role
                FROM
                    "projectMembers" pm
                JOIN
                    projects p
                ON
                    p.id = pm."projectId"
                WHERE
                    pm."projectId" = ${id} AND
                    pm."userId" = ${req.session.userId} AND
                    p."orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            const isOrgAdmin =
                req.session.role === "admin" || req.session.role === "owner";
            const isProjectAdmin = membership && membership.role === "admin";

            if (!isOrgAdmin && !isProjectAdmin) {
                const err = {
                    code: 404,
                    message:
                        "Either you don’t have permission to view this page, or this page doesn’t exist.",
                };
                return res.status(err.code).render("error", { err });
            }

            // Check first that project is exists.
            const exists = await sql`
                SELECT
                    1
                FROM 
                    projects p
                JOIN
                    "projectMembers" pm
                ON 
                    pm."projectId" = p.id AND 
                    pm."userId" = ${req.session.userId}
                WHERE 
                    p.id = ${id} AND 
                    p."orgId" = ${req.session.userOrgId} AND 
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!exists) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            // Update the project.
            const project = await sql`
                UPDATE
                    projects
                SET
                    name = ${name},
                    "dueDate" = ${dueDate},
                    description = ${description},
                    "updatedAt" = ${sql`now()`},
                    "updatedBy" = ${req.session.userId}
                WHERE 
                    id = ${id} AND 
                    "orgId" = ${req.session.userOrgId} AND 
                    "status" = 'active'
                returning id
            `.then(([x]) => x);

            req.flash("info", "Project updated successfully.");
            return res.redirect(`/projects/${project.id}`);
        } catch (err) {
            next(err);
        }
    },

    destroy: async (req, res, next) => {
        const id = req.params.id;

        try {
            const membership = await sql`
                SELECT
                    pm.role
                FROM
                    "projectMembers" pm
                JOIN
                    projects p
                ON
                    p.id = pm."projectId"
                WHERE
                    pm."projectId" = ${id} AND
                    pm."userId" = ${req.session.userId} AND
                    p."orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            const isOrgAdmin =
                req.session.role === "admin" || req.session.role === "owner";
            const isProjectAdmin = membership && membership.role === "admin";

            if (!isOrgAdmin && !isProjectAdmin) {
                const err = {
                    code: 404,
                    message:
                        "Either you don’t have permission to view this page, or this page doesn’t exist.",
                };
                return res.status(err.code).render("error", { err });
            }

            const exists = await sql`
                SELECT
                    1
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${id} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!exists) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            await sql`
                DELETE FROM
                    projects
                WHERE 
                    id = ${id} AND 
                    "orgId" = ${req.session.userOrgId}
            `.then(([x]) => x);

            req.flash("info", "Project deleted successfully.");
            return res.redirect("/projects");
        } catch (err) {
            next(err);
        }
    },

    // invite user to project.
    invite: async (req, res, next) => {
        const id = req.params.id;
        const { email } = req.body;

        if (!email) {
            req.flash("info", "Email is required.");
            return res.redirect(`/projects/${id}`);
        }

        // Create an invite link first.
        const token = cipher.token(32);
        const url = `${req.protocol}://${req.get("host")}/invite?token=${token}`;

        try {
            // First check if project exist or not.
            const project = await sql`
                SELECT
                    1
                FROM
                    projects p
                JOIN
                    "projectMembers" pm
                ON
                    pm."projectId" = p.id AND
                    pm."userId" = ${req.session.userId}
                WHERE
                    p.id = ${id} AND
                    p."orgId" = ${req.session.userOrgId} AND
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            // Check if user is already a member of this project.
            const invitedUser = await sql`
                SELECT
                    id,
                    email
                FROM
                    users
                WHERE
                    email = ${email}
            `.then(([x]) => x);

            if (invitedUser) {
                const existingMember = await sql`
                    SELECT
                        1
                    FROM
                        "projectMembers"
                    WHERE
                        "projectId" = ${id} AND
                        "userId" = ${invitedUser.id}
                `.then(([x]) => x);

                if (existingMember) {
                    req.flash(
                        "info",
                        "User is already a member of this project.",
                    );
                    return res.redirect(`/projects/${id}`);
                }
            }

            // Check if user is already invited to this project.
            const existingInvite = await sql`
                SELECT
                    id,
                    "expiresAt",
                    status
                FROM
                    "invites"
                WHERE
                    "orgId" = ${req.session.userOrgId} AND
                    "projectId" = ${id} AND
                    "email" = ${email} AND
                    status = 'invited' AND
                    "expiresAt" > ${sql`now()`}
                ORDER BY
                    id DESC
                LIMIT
                    1
            `.then(([x]) => x);

            if (existingInvite) {
                req.flash("info", "User is already invited.");
                return res.redirect(`/projects/${id}`);
            }

            await sql`
                INSERT INTO "invites" (
                    "orgId",
                    "projectId",
                    "email",
                    "token",
                    "expiresAt",
                    "createdBy",
                    "invitedUserId"
                ) VALUES (
                    ${req.session.userOrgId},
                    ${id},
                    ${email},
                    ${token},
                    ${sql`NOW() + INTERVAL '24 hours'`},
                    ${req.session.userId},
                    ${invitedUser ? invitedUser.id : null}
                )
            `.then(([x]) => x);

            console.log(url);
            req.flash("info", "Invite created successfully.");
            return res.redirect(`/projects/${id}`);
        } catch (err) {
            next(err);
        }
    },
};
