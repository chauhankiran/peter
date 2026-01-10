const sql = require("../db/sql");
const { PER_PAGE, views } = require("../constants/app");
const generatePaginationLinks = require("../helpers/generate-pagination-links");
const cipher = require("../helpers/cipher");

module.exports = {
    index: async (req, res, next) => {
        const orgId = req.session.orgId;
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
                sql`p.key iLIKE ${"%" + search + "%"} OR p.name iLIKE ${"%" + search + "%"}`,
            );
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        try {
            const projects = await sql`
                SELECT
                    p.id, 
                    p.name, 
                    p.key, 
                    p."dueDate", 
                    p."createdAt",
                    u."firstName",
                    u."lastName"
                FROM 
                    projects p
                JOIN
                    "projectMembers" pm
                ON 
                    pm."projectId" = p.id AND 
                    pm."userId" = ${userId}
                LEFT JOIN
                    users u
                ON
                    p."createdBy" = u.id
                WHERE 
                    ${whereClause.length > 0 ? sql`${whereClause} AND` : sql``}
                    p."orgId" = ${orgId} AND 
                    p."status" = 'active'
                ORDER BY
                    ${sql(orderBy)}
                    ${orderDir === "ASC" ? sql`ASC` : sql`DESC`}
                LIMIT
                    ${limit}
                OFFSET
                    ${skip}
            `;

            const count = 9;
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
                projects,
                search,
                paginationLinks,
                orderBy,
                orderDir,
            });
        } catch (err) {
            next(err);
        }
    },

    new: (req, res) => {
        const project = {};
        return res.render(views.newProjectPath, { project });
    },

    create: async (req, res, next) => {
        const { name, key, dueDate, description } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        if (!key) {
            errors.push("Key is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;

            const project = {
                name,
                key,
                dueDate,
                description,
            };
            return res.render(views.newProjectPath, { project });
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
                        key,
                        "dueDate", 
                        description,
                        "orgId", 
                        "createdBy"
                    ) VALUES (
                        ${name}, 
                        ${key}, 
                        ${dueDate}, 
                        ${description},
                        ${req.session.orgId}, 
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
                        (${req.session.orgId}, ${project.id}, 'To do', 10, false, ${req.session.userId}),
                        (${req.session.orgId}, ${project.id}, 'In progress', 20, false, ${req.session.userId}),
                        (${req.session.orgId}, ${project.id}, 'Done', 30, true, ${req.session.userId})
                `;
            });

            req.flash("info", "Project created successfully.");
            res.redirect("/projects");
        } catch (err) {
            if (err.code === "23505") {
                // Unique violation.
                res.locals.errors = ["Project key must be unique."];

                const project = { name, dueDate, description };
                return res.render(views.newProjectPath, { project });
            }
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
                    p.key, 
                    p."dueDate", 
                    p.description,
                    p."createdAt",
                    p."updatedAt",
                    u."firstName",
                    u."lastName",
                    uu."firstName" as "updatedByFirstName",
                    uu."lastName" as "updatedByLastName"
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
                    p."orgId" = ${req.session.orgId} AND 
                    p."status" = 'active'
            `.then(([x]) => x);

            if (!project) {
                req.flash("error", "Project not found.");
                return res.redirect("/projects");
            }

            // Get all project members.
            const projectMembers = await sql`
                SELECT
                    pm."userId" as "userId",
                    pm.role as role,
                    u."firstName" as "firstName",
                    u."lastName" as "lastName",
                    u.email as email
                FROM
                    "projectMembers" pm
                JOIN
                    projects p
                ON
                    p.id = pm."projectId"
                JOIN
                    users u
                ON
                    u.id = pm."userId"
                WHERE
                    pm."projectId" = ${id} AND
                    p."orgId" = ${req.session.orgId} AND
                    p."status" = 'active'
                ORDER BY
                    pm.role ASC,
                    u."firstName" ASC,
                    u."lastName" ASC
            `;

            const { count: workCount } = await sql`
                SELECT
                    count(*)
                FROM
                    "work" w
                WHERE
                    w."orgId" = ${req.session.orgId} AND
                    w."projectId" = ${id} AND
                    w."isActive" = true
            `.then(([x]) => x);

            const workItems = await sql`
                SELECT
                    w.id,
                    w."workId",
                    w.title,
                    w."dueDate",
                    w."completedAt",
                    s.name as "statusName",
                    u."firstName" as "assigneeFirstName",
                    u."lastName" as "assigneeLastName"
                FROM
                    "work" w
                JOIN
                    "statuses" s
                ON
                    s.id = w."statusId"
                LEFT JOIN
                    users u
                ON
                    u.id = w."assigneeId"
                WHERE
                    w."orgId" = ${req.session.orgId} AND
                    w."projectId" = ${id} AND
                    w."isActive" = true
                ORDER BY
                    w.id DESC
                LIMIT
                    3
            `;

            return res.render(views.showProjectPath, {
                project,
                projectMembers,
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
            const project = await sql`
                SELECT
                    p.id, 
                    p.name, 
                    p.key, 
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
                    p."orgId" = ${req.session.orgId} AND 
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
        const { name, key, dueDate, description } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Name is required.");
            validationFailed = true;
        }

        if (!key) {
            errors.push("Key is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;

            const project = {
                name,
                key,
                dueDate,
                description,
            };
            return res.render(views.editProjectPath, { project });
        }

        try {
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
                    p."orgId" = ${req.session.orgId} AND 
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
                    key = ${key},
                    "dueDate" = ${dueDate},
                    description = ${description},
                    "updatedAt" = ${sql`now()`},
                    "updatedBy" = ${req.session.userId}
                WHERE 
                    id = ${id} AND 
                    "orgId" = ${req.session.orgId} AND 
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
                    p."orgId" = ${req.session.orgId} AND
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
                    "orgId" = ${req.session.orgId}
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
                    p."orgId" = ${req.session.orgId} AND
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
                    req.flash("info", "User is already a member of this project.");
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
                    "orgId" = ${req.session.orgId} AND
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
                    ${req.session.orgId},
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
