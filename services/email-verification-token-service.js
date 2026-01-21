const sql = require("../db/sql");

module.exports = {
    findByToken: async (token) => {
        return await sql`
            SELECT * FROM "emailVerificationTokens" WHERE token = ${token}
        `.then(([x]) => x);
    },

    findByUserId: async (userId) => {
        return await sql`
            SELECT * FROM "emailVerificationTokens" WHERE "userId" = ${userId}
        `;
    },

    create: async (data) => {
        const { userId, token, expiresAt } = data;
        return await sql`
            INSERT INTO "emailVerificationTokens" ("userId", token, "expiresAt")
            VALUES (${userId}, ${token}, ${expiresAt})
            RETURNING *
        `.then(([x]) => x);
    },

    markAsUsed: async (id) => {
        return await sql`
            UPDATE "emailVerificationTokens"
            SET "usedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id) => {
        return await sql`
            DELETE FROM "emailVerificationTokens" WHERE id = ${id}
        `;
    },
};
