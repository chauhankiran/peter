const sql = require("../db/sql");

module.exports = {
    findAll: async (workId) => {
        return await sql`
            SELECT * FROM "comments" WHERE "workId" = ${workId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "comments" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { orgId, userId, projectId, workId, body, createdBy } = data;
        return await sql`
            INSERT INTO "comments" ("orgId", "userId", "projectId", "workId", body, "createdBy")
            VALUES (${orgId}, ${userId}, ${projectId}, ${workId}, ${body}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { body, status, updatedBy } = data;
        return await sql`
            UPDATE "comments"
            SET
                body = COALESCE(${body}, body),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "comments"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
