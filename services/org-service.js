const sql = require("../db/sql");

module.exports = {
    findAll: async () => {
        return await sql`
            SELECT * FROM "orgs" WHERE status = 'active'
        `;
    },

    findById: async (id) => {
        return await sql`
            SELECT * FROM "orgs" WHERE id = ${id}
        `.then(([x]) => x);
    },

    create: async (opts) => {
        const { conn, name, createdBy } = opts;

        const _sql = conn ? conn : sql;

        return await _sql`
            INSERT INTO "orgs" (
                name, 
                "createdBy"
            ) VALUES (
                ${name}, 
                ${createdBy}
            ) returning id
        `.then(([x]) => x);
    },

    update: async (id, data) => {
        const { name, description, avatar, status, updatedBy } = data;
        return await sql`
            UPDATE "orgs"
            SET
                name = COALESCE(${name}, name),
                description = COALESCE(${description}, description),
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
            UPDATE "orgs"
            SET status = 'archived', "updatedBy" = ${updatedBy}, "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *
        `.then(([x]) => x);
    },
};
