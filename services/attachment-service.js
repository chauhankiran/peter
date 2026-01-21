const sql = require("../db/sql");

module.exports = {
    findAll: async (workId) => {
        return await sql`
            SELECT * FROM "attachments" WHERE "workId" = ${workId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "attachments" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { orgId, userId, projectId, workId, name, original, mime, size, path, createdBy } = data;
        return await sql`
            INSERT INTO "attachments" ("orgId", "userId", "projectId", "workId", name, original, mime, size, path, "createdBy")
            VALUES (${orgId}, ${userId}, ${projectId}, ${workId}, ${name}, ${original}, ${mime}, ${size}, ${path}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { name, status, updatedBy } = data;
        return await sql`
            UPDATE "attachments"
            SET
                name = COALESCE(${name}, name),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "attachments"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
