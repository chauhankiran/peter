const sql = require("../db/sql");

module.exports = {
    getWorkCount: async (opts) => {
        const { projectId, orgId } = opts;

        return await sql`
            SELECT
                COUNT(w.id)
            FROM
                work w
            WHERE
                w."orgId" = ${orgId} AND
                w."projectId" = ${projectId} AND
                w."isActive" = true
        `.then(([x]) => x);
    },
}
