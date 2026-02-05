const express = require('express');
const { isAuth, isProject, isWork } = require('./middleware');
const sql = require('./db/sql');

const router = express.Router({ mergeParams: true });

router.use(isAuth, isProject, isWork);

router.post('/', async (req, res, next) => {
    const projectId = req.params.projectId;
    const workId = req.params.workId;
    const content = req.body.content;

    if (!content) {
        req.flash('error', 'Comment is required.');
        return res.redirect(`/projects/${projectId}/works/${workId}`);
    }

    try {
        await sql`
            INSERT INTO "comments" (
                "projectId",
                "workId",
                content,
                "createdBy"
            ) VALUES (
                ${projectId},
                ${workId},
                ${content},
                ${req.session.userId}
            );
        `;

        req.flash('info', 'Comment is created');
        return res.redirect(`/projects/${projectId}/works/${workId}`);
    } catch (err) {
        next(err);
    }
});

router.put('/:commentId', async (req, res, next) => {
    const projectId = req.params.projectId;
    const workId = req.params.workId;
    const commentId = req.params.commentId;
    const content = req.body.content;

    if (!content) {
        req.flash('error', 'Comment is required.');
        return res.redirect(`/projects/${projectId}/works/${workId}`);
    }

    try {
        await sql`
            UPDATE 
                "comments"
            SET 
                content = ${content},
                "updatedBy" = ${req.session.userId},
                "updatedAt" = ${sql`NOW()`}
            WHERE 
                id = ${commentId} AND
                "createdBy" = ${req.session.userId};
        `;

        req.flash('info', 'Comment is updated');
        return res.redirect(`/projects/${projectId}/works/${workId}`);
    } catch (err) {
        next(err);
    }
});

router.delete('/:commentId', async (req, res, next) => {
    const projectId = req.params.projectId;
    const workId = req.params.workId;
    const commentId = req.params.commentId;

    try {
        await sql`
            DELETE FROM 
                "comments"
            WHERE 
                id = ${commentId} AND
                "createdBy" = ${req.session.userId}
        `;

        req.flash('info', 'Comment is deleted');
        return res.redirect(`/projects/${projectId}/works/${workId}`);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
