const sql = require("../db/sql");

module.exports = {
    findAll: async (projectId) => {
        return await sql`
            SELECT * FROM "projectMembers" WHERE "projectId" = ${projectId} AND status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "projectMembers" WHERE id = ${id}
        `.then(([x]) => x);
    },

    findByUserAndProject: async (userId, projectId) => {
        return await sql`
            SELECT * FROM "projectMembers" WHERE "userId" = ${userId} AND "projectId" = ${projectId}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { projectId, userId, role, createdBy } = data;
        return await sql`
            INSERT INTO "projectMembers" ("projectId", "userId", role, "createdBy")
            VALUES (${projectId}, ${userId}, ${role}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { role, status, updatedBy } = data;
        return await sql`
            UPDATE "projectMembers"
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
            UPDATE "projectMembers"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
