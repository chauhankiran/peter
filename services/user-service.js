const sql = require("../db/sql");

module.exports = {
    find: async (opts) => {
        const { columns, email } = opts;

        return await sql`
            SELECT
                ${sql.unsafe(columns)}
            FROM 
                "users"
            WHERE
                email = ${email}`;
    },

    findAll: async () => {
        return await sql`
            SELECT * FROM "users" WHERE status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "users" WHERE id = ${id}
        `.then(([x]) => x);
    },

    findByEmail: async (email) => {
        return await sql`
            SELECT * FROM "users" WHERE email = ${email}
        `.then(([x]) => x);
    },

    create: async (data) => {
        const { name, email, password, avatar, createdBy } = data;
        return await sql`
            INSERT INTO "users" (name, email, password, avatar, "createdBy")
            VALUES (${name}, ${email}, ${password}, ${avatar}, ${createdBy})
            RETURNING *
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { name, email, password, avatar, status, updatedBy } = data;
        return await sql`
            UPDATE "users"
            SET
                name = COALESCE(${name}, name),
                email = COALESCE(${email}, email),
                password = COALESCE(${password}, password),
                avatar = COALESCE(${avatar}, avatar),
                status = COALESCE(${status}, status),
                "updatedBy" = ${updatedBy},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },

    delete: async (id, updatedBy) => {
        return await sql`
            UPDATE "users"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
