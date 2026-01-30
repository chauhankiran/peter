const sql = require('./db/sql');
const service = require('./service');

// Check if the user is logged-in or not.
const isAuth = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }

    req.flash('error', 'You must need to login in order to view the page.');
    return res.redirect('/login');
};

// Check if given project exists or not.
const isProject = async (req, res, next) => {
    const projectId = req.params.projectId;

    try {
        const ok = await service.isProject(projectId);

        if (ok) {
            return next();
        }

        req.flash('error', 'Project not found.');
        return res.redirect('/projects');
    } catch (err) {
        return next(err);
    }
};

// Check if given work exists or not.
const isWork = async (req, res, next) => {
    const projectId = req.params.projectId;
    const workId = req.params.workId;

    try {
        const ok = await service.isWork(workId);

        if (ok) {
            return next();
        }

        req.flash('error', 'Work not found.');
        return res.redirect(`/projects/${projectId}`);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    isAuth,
    isProject,
    isWork,
};
