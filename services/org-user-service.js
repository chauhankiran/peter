const sql = require("../db/sql");

module.exports = {
    find: async (opts) => {
        const { columns, userId } = opts;

        return await sql`
            SELECT
                ${sql.unsafe(columns)}
            FROM 
                "orgUsers"
            WHERE
                "userId" = ${userId}`;
    },

    count: async (opts) => {
        const { userId } = opts;

        return await sql`
            SELECT
                count(id)
            FROM
                "orgUsers"
            WHERE
                "userId" = ${userId}
        `.then(([x]) => x);
    },

    findAll: async (orgId) => {
        return await sql`
            SELECT * FROM "orgUsers" WHERE "orgId" = ${orgId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "orgUsers" WHERE id = ${id}
        `.then(([x]) => x);
    },

    findByUserAndOrg: async (userId, orgId) => {
        return await sql`
            SELECT * FROM "orgUsers" WHERE "userId" = ${userId} AND "orgId" = ${orgId}
        `.then(([x]) => x);
    },

    create: async (opts) => {
        const { conn, userId, orgId, role, createdBy } = opts;

        const _sql = conn ? conn : sql;

        return await _sql`
            INSERT INTO "orgUsers" (
                "userId", 
                "orgId", 
                role, 
                "createdBy"
            ) VALUES (
                ${userId}, 
                ${orgId}, 
                ${role}, 
                ${createdBy}
            ) returning role
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { role, status, updatedBy } = data;
        return await sql`
            UPDATE "orgUsers"
            SET
                role = COALESCE(${role}, role),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "orgUsers"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
