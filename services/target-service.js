const sql = require("../db/sql");

module.exports = {
    findAll: async (projectId) => {
        return await sql`
            SELECT * FROM "targets" WHERE "projectId" = ${projectId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "targets" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { orgId, projectId, name, description, dueDate, createdBy } = data;
        return await sql`
            INSERT INTO "targets" ("orgId", "projectId", name, description, "dueDate", "createdBy")
            VALUES (${orgId}, ${projectId}, ${name}, ${description}, ${dueDate}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { name, description, dueDate, status, updatedBy } = data;
        return await sql`
            UPDATE "targets"
            SET
                name = COALESCE(${name}, name),
                description = COALESCE(${description}, description),
                "dueDate" = COALESCE(${dueDate}, "dueDate"),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "targets"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
