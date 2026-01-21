module.exports = {
    destroy: (req, res, next) => {
        req.session.destroy((err) => {
            if (err) {
                next(err);
            }

            return res.redirect("/");
        });
    },
};
