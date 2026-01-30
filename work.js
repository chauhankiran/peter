const express = require('express');
const { isAuth, isProject, isWork } = require('./middleware');
const sql = require('./db/sql');
const { getPriorities, getTypes, getStatuses } = require('./service');

const router = express.Router({ mergeParams: true });

router.use(isAuth, isProject);

router.get('/new', async (req, res, next) => {
    const projectId = req.params.projectId;

    try {
        const projects = await sql`
            SELECT
                id,
                name
            FROM
                "projects"
            ORDER BY
                name
        `;

        const users = await sql`
            SELECT
                id,
                name
            FROM
                "users"
            ORDER BY
                name
        `;

        const types = await getTypes(projectId);
        const priorities = await getPriorities(projectId);
        const statuses = await getStatuses(projectId);

        return res.render('works/new', {
            title: 'New work',
            projects,
            projectId,
            users,
            types,
            priorities,
            statuses,
        });
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    const projectId = req.params.projectId;
    const { title, description, assigneeId, statusId, typeId, priorityId, dueDate } = req.body;

    try {
        const work = await sql`
            INSERT INTO "works" (
                title,
                description,
                "projectId",
                "dueDate",
                "assigneeId",
                "statusId",
                "typeId",
                "priorityId",
                "createdBy"
            ) VALUES (
                ${title},
                ${description || null},
                ${projectId || null},
                ${dueDate || null},
                ${assigneeId || null},
                ${statusId || null},
                ${typeId || null},
                ${priorityId || null},
                ${req.session.userId}
            ) returning id
        `.then(([x]) => x);

        req.flash('info', 'Work is created');
        return res.redirect(`/projects/${projectId}/works/${work.id}`);
    } catch (err) {
        next(err);
    }
});

router.get('/:workId', isWork, async (req, res, next) => {
    const workId = req.params.workId;

    try {
        const work = await sql`
            SELECT
                w.id,
                w.title,
                w.description,
                w."projectId",
                w."dueDate",
                w."assigneeId",
                u.name AS "assigneeName",
                w."statusId",
                w."typeId",
                ps.name AS "projectName",
                t.name AS "typeName",
                p.name AS "priorityName",
                s.name AS "statusName",
                w."priorityId",
                w."createdBy",
                w."createdAt"
            FROM
                works w
            LEFT JOIN
                projects ps ON w."projectId" = ps.id
            LEFT JOIN
                users u ON w."assigneeId" = u.id
            LEFT JOIN
                types t ON w."typeId" = t.id
            LEFT JOIN
                priorities p ON w."priorityId" = p.id
            LEFT JOIN
                statuses s ON w."statusId" = s.id
            WHERE
                w.id = ${workId}
        `.then(([x]) => x);

        return res.render('works/show', {
            title: work.title,
            work,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/:workId/edit', isWork, async (req, res, next) => {
    const workId = req.params.workId;

    try {
        const projects = await sql`
            SELECT
                id,
                name
            FROM
                "projects"
            ORDER BY
                name
        `;

        const users = await sql`
            SELECT
                id,
                name
            FROM
                "users"
            ORDER BY
                name
        `;

        const work = await sql`
            SELECT
                id,
                title,
                description,
                "projectId",
                "dueDate",
                "assigneeId",
                "statusId",
                "typeId",
                "priorityId",
                "createdBy",
                "createdAt"
            FROM
                works
            WHERE
                id = ${workId}
        `.then(([x]) => x);

        const types = await getTypes(work.projectId);
        const priorities = await getPriorities(work.projectId);
        const statuses = await getStatuses(work.projectId);

        return res.render('works/edit', {
            title: work.title,
            projects,
            work,
            projectId: work.projectId,
            users,
            types,
            priorities,
            statuses,
        });
    } catch (err) {
        next(err);
    }
});

router.put('/:workId', isWork, async (req, res, next) => {
    const workId = req.params.workId;
    const projectId = req.params.projectId;
    const { title, description, assigneeId, statusId, typeId, priorityId, dueDate } = req.body;

    if (!projectId) {
        req.flash('error', 'Project is required.');
        return res.redirect('/projects');
    }

    try {
        await sql`
            UPDATE
                "works"
            SET
                title = ${title},
                description = ${description || null},
                "projectId" = ${projectId || null},
                "dueDate" = ${dueDate || null},
                "assigneeId" = ${assigneeId || null},
                "statusId" = ${statusId || null},
                "typeId" = ${typeId || null},
                "priorityId" = ${priorityId || null},
                "updatedBy" = ${req.session.userId},
                "updatedAt" = ${sql`NOW()`}
            WHERE
                id = ${workId}
        `.then(([x]) => x);

        req.flash('info', 'Work is updated.');
        return res.redirect(`/projects/${projectId}/works/${workId}`);
    } catch (err) {
        next(err);
    }
});

router.delete('/:workId', isWork, async (req, res, next) => {
    const projectId = req.params.projectId;
    const workId = req.params.workId;

    try {
        await sql`
            DELETE FROM
                "works"
            WHERE
                id = ${workId}
        `;

        req.flash('info', 'Work is deleted.');
        res.redirect(`/projects/${projectId}`);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
