const express = require('express');
const { isAuth, isProject } = require('./middleware');
const sql = require('./db/sql');

const router = express.Router();

router.use(isAuth);

router.get('/', async (req, res, next) => {
    try {
        const projects = await sql`
            SELECT
                id,
                name,
                "dueDate",
                "description"
            FROM
                projects
            ORDER BY
                id DESC
        `;

        res.render('projects/index', {
            title: 'Projects',
            projects,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/new', (req, res, next) => {
    res.render('projects/new', {
        title: 'New project',
    });
});

router.post('/', async (req, res, next) => {
    const { name, dueDate, description } = req.body;

    if (!name) {
        req.flash('error', 'Name is required.');
        return res.redirect('/projects/new');
    }

    try {
        const project = await sql`
            INSERT INTO "projects" (
                name,
                "dueDate",
                description,
                "createdBy"
            ) VALUES (
                ${name} ,
                ${dueDate || null},
                ${description || null},
                ${req.session.userId}
            ) returning id;
        `.then(([x]) => x);

        // Add types for the project.
        await sql`
            INSERT INTO "types" (
                "projectId", 
                name, 
                sequence, 
                "createdBy"
            ) VALUES
                (${project.id}, 'Task', 10, ${req.session.userId}),
                (${project.id}, 'Bug', 20, ${req.session.userId}),
                (${project.id}, 'Question', 30, ${req.session.userId}),
                (${project.id}, 'Docs', 40, ${req.session.userId})
        `;

        // Add priorities for the project.
        await sql`
            INSERT INTO "priorities" (
                "projectId", 
                name, 
                sequence, 
                "createdBy"
            ) VALUES
                (${project.id}, 'Low', 10, ${req.session.userId}),
                (${project.id}, 'Normal', 20, ${req.session.userId}),
                (${project.id}, 'High', 30, ${req.session.userId}),
                (${project.id}, 'Urgent', 40, ${req.session.userId})
        `;

        // Add statuses for the project.
        await sql`
            INSERT INTO "statuses" (
                "projectId", 
                name, 
                sequence, 
                "isDone",
                "createdBy"
            ) VALUES
                (${project.id}, 'Todo', 10, 'f', ${req.session.userId}),
                (${project.id}, 'Inprogress', 20, 'f', ${req.session.userId}),
                (${project.id}, 'Done', 30, 't', ${req.session.userId})
        `;

        req.flash('info', 'Project is created.');
        res.redirect('/projects');
    } catch (err) {
        next(err);
    }
});

router.get('/:projectId', isProject, async (req, res, next) => {
    const projectId = req.params.projectId;

    try {
        const project = await sql`
            SELECT
                id,
                name,
                "dueDate",
                description
            FROM
                "projects"
            WHERE
                id = ${projectId}
        `.then(([x]) => x);

        const works = await sql`
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
                t.name AS "typeName",
                p.name AS "priorityName",
                s.name AS "statusName",
                w."priorityId",
                w."createdBy",
                w."createdAt"
            FROM
                works w
            LEFT JOIN
                users u ON w."assigneeId" = u.id
            LEFT JOIN
                types t ON w."typeId" = t.id
            LEFT JOIN
                priorities p on w."priorityId" = p.id 
            LEFT JOIN
                statuses s on w."statusId" = s.id
            WHERE
                w."projectId" = ${projectId}
        `;

        return res.render('projects/show', {
            title: project.name,
            project,
            works,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/:projectId/edit', isProject, async (req, res, next) => {
    const projectId = req.params.projectId;

    try {
        const project = await sql`
            SELECT
                id,
                name,
                "dueDate",
                description
            FROM
                "projects"
            WHERE
                id = ${projectId}
        `.then(([x]) => x);

        return res.render('projects/edit', {
            title: project.name,
            project,
        });
    } catch (err) {
        next(err);
    }
});

router.put('/:projectId', isProject, async (req, res, next) => {
    const projectId = req.params.projectId;
    const { name, dueDate, description } = req.body;

    if (!name) {
        req.flash('error', 'Name is required.');
        return res.redirect('/projects/new');
    }

    try {
        await sql`
            UPDATE
                "projects"
            SET
                name = ${name},
                "dueDate" = ${dueDate || null},
                description = ${description || null},
                "updatedAt" = ${sql`NOW()`},
                "updatedBy" = ${req.session.userId}
            WHERE
                id = ${projectId}
        `;

        req.flash('info', 'Project is updated.');
        return res.redirect(`/projects/${projectId}`);
    } catch (err) {
        next(err);
    }
});

router.delete('/:projectId', isProject, async (req, res, next) => {
    const projectId = req.params.projectId;

    try {
        await sql`
            DELETE FROM
                "projects"
            WHERE
                id = ${projectId}
        `;

        req.flash('info', 'Project is deleted.');
        res.redirect('/projects');
    } catch (err) {
        next(err);
    }
});

module.exports = router;
