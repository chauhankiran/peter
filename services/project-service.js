const sql = require("../db/sql");

module.exports = {
    find: async (opts) => {
        const { search, limit, skip, orderBy, orderDir, orgId, userId } = opts;

        const whereClauses = [];

        if (search) {
            whereClauses.push(sql`p.name iLIKE ${"%" + search + "%"}`);
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        return await sql`
            SELECT
                p.id, 
                p.name, 
                p."dueDate", 
                p."createdAt",
                u.name as "createdByName",
                COALESCE(w."totalWork", 0)::int as "totalWork",
                COALESCE(w."doneWork", 0)::int as "doneWork"
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
            LEFT JOIN (
                SELECT
                    "projectId",
                    COUNT(*) as "totalWork",
                    COUNT("completedAt") as "doneWork"
                FROM
                    works
                WHERE
                    status = 'active'
                GROUP BY
                    "projectId"
            ) w ON w."projectId" = p.id
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
    },

    count: async (opts) => {
        const { search, orgId, userId } = opts;

        const whereClauses = [];

        if (search) {
            whereClauses.push(sql`p.name iLIKE ${"%" + search + "%"}`);
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        return await sql`
            SELECT
               COUNT(p.id)
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
        `.then(([x]) => x);
    },

    getMembers: async (opts) => {
        const { projectId, orgId } = opts;

        return await sql`
            SELECT
                pm."userId" as "userId",
                pm.role as role,
                u.name as name,
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
                p."orgId" = ${orgId} AND
                pm."projectId" = ${projectId}
            ORDER BY
                pm.role ASC,
                u.name ASC
        `;
    },

    count: async (opts) => {
        const { search, orgId, userId } = opts;

        const whereClauses = [];

        if (search) {
            whereClauses.push(sql`p.name iLIKE ${"%" + search + "%"}`);
        }

        const whereClause = whereClauses.flatMap((x, i) =>
            i ? [sql`and`, x] : x,
        );

        return await sql`
            SELECT
               COUNT(p.id)
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
        `.then(([x]) => x);
    },

    getMembers: async (opts) => {
        const { projectId, orgId } = opts;

        return await sql`
            SELECT
                pm."userId" as "userId",
                pm.role as role,
                u.name as name,
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
                p."orgId" = ${orgId} AND
                pm."projectId" = ${projectId}
            ORDER BY
                pm.role ASC,
                u.name ASC
        `;
    },
    findAll: async (orgId) => {
        return await sql`
            SELECT * FROM "projects" WHERE "orgId" = ${orgId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "projects" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const {
            orgId,
            name,
            description,
            avatarUrl,
            dueDate,
            isMilestonesEnabled,
            isTargetsEnabled,
            createdBy,
        } = data;
        return await sql`
            INSERT INTO "projects" ("orgId", name, description, "avatarUrl", "dueDate", "isMilestonesEnabled", "isTargetsEnabled", "createdBy")
            VALUES (${orgId}, ${name}, ${description}, ${avatarUrl}, ${dueDate}, ${isMilestonesEnabled}, ${isTargetsEnabled}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const {
            name,
            description,
            avatarUrl,
            dueDate,
            isMilestonesEnabled,
            isTargetsEnabled,
            status,
            updatedBy,
        } = data;
        return await sql`
            UPDATE "projects"
            SET
                name = COALESCE(${name}, name),
                description = COALESCE(${description}, description),
                "avatarUrl" = COALESCE(${avatarUrl}, "avatarUrl"),
                "dueDate" = COALESCE(${dueDate}, "dueDate"),
                "isMilestonesEnabled" = COALESCE(${isMilestonesEnabled}, "isMilestonesEnabled"),
                "isTargetsEnabled" = COALESCE(${isTargetsEnabled}, "isTargetsEnabled"),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "projects"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
