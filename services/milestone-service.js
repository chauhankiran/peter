const sql = require("../db/sql");

module.exports = {
    findAll: async (projectId) => {
        return await sql`
            SELECT * FROM "milestones" WHERE "projectId" = ${projectId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "milestones" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { orgId, projectId, targetId, name, description, dueDate, createdBy } = data;
        return await sql`
            INSERT INTO "milestones" ("orgId", "projectId", "targetId", name, description, "dueDate", "createdBy")
            VALUES (${orgId}, ${projectId}, ${targetId}, ${name}, ${description}, ${dueDate}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { targetId, name, description, dueDate, status, updatedBy } = data;
        return await sql`
            UPDATE "milestones"
            SET
                "targetId" = COALESCE(${targetId}, "targetId"),
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
            UPDATE "milestones"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
