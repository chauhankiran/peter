const isAuth = (req, res, next) => {
    if (!req.session.userId) {
        const err = {
            code: 404,
            message:
                "Either you don’t have permission to view this page, or this page doesn’t exist.",
        };
        return res.status(err.code).render("error", { err });
    }

    next();
};

module.exports = isAuth;
