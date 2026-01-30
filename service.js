const sql = require('./db/sql');

const isProject = async (projectId) =>
    await sql`
        SELECT
            1
        FROM
            "projects"
        WHERE
            id = ${projectId}
    `.then(([x]) => x);

const isWork = async (workId) =>
    await sql`
        SELECT
            1
        FROM
            "works"
        WHERE
            id = ${workId}
    `.then(([x]) => x);

const getTypes = async (projectId) =>
    await sql`
        SELECT
            id,
            name
        FROM
            "types"
        WHERE
            "projectId" = ${projectId}
        ORDER BY
            sequence
    `;

const getPriorities = async (projectId) =>
    await sql`
        SELECT
            id,
            name
        FROM
            "priorities"
        WHERE
            "projectId" = ${projectId}
        ORDER BY
            sequence
    `;

const getStatuses = async (projectId) =>
    await sql`
        SELECT
            id,
            name
        FROM
            "statuses"
        WHERE
            "projectId" = ${projectId}
        ORDER BY
            sequence
    `;

module.exports = {
    isProject,
    isWork,
    getTypes,
    getPriorities,
    getStatuses,
};
