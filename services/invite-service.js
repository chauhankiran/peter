const sql = require("../db/sql");

module.exports = {
    findAll: async (orgId) => {
        return await sql`
            SELECT * FROM "invites" WHERE "orgId" = ${orgId}
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "invites" WHERE id = ${id}
        `.then(([x]) => x);
    },

    findByToken: async (token) => {
        return await sql`
            SELECT * FROM "invites" WHERE token = ${token}
        `.then(([x]) => x);
    },

    findByEmail: async (email, orgId) => {
        return await sql`
            SELECT * FROM "invites" WHERE email = ${email} AND "orgId" = ${orgId}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { orgId, projectId, email, token, expiresAt, role, createdBy } = data;
        return await sql`
            INSERT INTO "invites" ("orgId", "projectId", email, token, "expiresAt", role, "createdBy")
            VALUES (${orgId}, ${projectId}, ${email}, ${token}, ${expiresAt}, ${role}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { status, acceptedAt, invitedUserId, updatedBy } = data;
        return await sql`
            UPDATE "invites"
            SET
                status = COALESCE(${status}, status),
                "acceptedAt" = COALESCE(${acceptedAt}, "acceptedAt"),
                "invitedUserId" = COALESCE(${invitedUserId}, "invitedUserId"),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id) => {
        return await sql`
            DELETE FROM "invites" WHERE id = ${id}
        `;
    },
};
