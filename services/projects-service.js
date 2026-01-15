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
                u.name as "createdByName"
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
}