const sql = require("../db/sql");

module.exports = {
    findByToken: async (token) => {
        return await sql`
            SELECT * FROM "resetPasswordTokens" WHERE token = ${token}
        `.then(([x]) => x);
    },

    findByUserId: async (userId) => {
        return await sql`
            SELECT * FROM "resetPasswordTokens" WHERE "userId" = ${userId}
        `;
    },

    create: async (data) => {
        const { userId, token, expiresAt } = data;
        return await sql`
            INSERT INTO "resetPasswordTokens" ("userId", token, "expiresAt")
            VALUES (${userId}, ${token}, ${expiresAt})
            RETURNING *
        `.then(([x]) => x);
    },

    markAsUsed: async (id) => {
        return await sql`
            UPDATE "resetPasswordTokens"
            SET "usedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id) => {
        return await sql`
            DELETE FROM "resetPasswordTokens" WHERE id = ${id}
        `;
    },
};
