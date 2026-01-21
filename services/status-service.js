const sql = require("../db/sql");

module.exports = {
    findAll: async (projectId) => {
        return await sql`
            SELECT * FROM "statuses" WHERE "projectId" = ${projectId} AND status = 'active' ORDER BY sequence
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "statuses" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { orgId, projectId, name, sequence, createdBy } = data;
        return await sql`
            INSERT INTO "statuses" ("orgId", "projectId", name, sequence, "createdBy")
            VALUES (${orgId}, ${projectId}, ${name}, ${sequence}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { name, sequence, status, updatedBy } = data;
        return await sql`
            UPDATE "statuses"
            SET
                name = COALESCE(${name}, name),
                sequence = COALESCE(${sequence}, sequence),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "statuses"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
