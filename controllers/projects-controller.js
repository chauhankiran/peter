const sql = require("../db/sql");
const { PER_PAGE, views } = require("../constants/app");
const generatePaginationLinks = require("../helpers/generate-pagination-links");

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
        });
    },

    new: (req, res) => {
        res.render(views.newProjectPath);
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
            return res.render(views.newProjectPath, {
                name,
                key,
                dueDate,
                description,
            });
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
                        ${dueDate || null}, 
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
            });

            req.flash("info", "Project created successfully.");
            res.redirect("/projects");
        } catch (err) {
            if (err.code === "23505") {
                // Unique violation.
                res.locals.errors = ["Project key must be unique."];
                return res.render(views.newProjectPath, {
                    name,
                    dueDate,
                    description,
                });
            }
            next(err);
        }
    },

    show: (req, res) => {
        res.render("projects/show");
    },
    edit: (req, res) => {
        res.render("projects/edit");
    },
    update: (req, res) => {},
    destroy: (req, res) => {},
};
