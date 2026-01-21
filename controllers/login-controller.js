const { views } = require("../constants/app");
const sql = require("../db/sql");
const cipher = require("../helpers/cipher");
const orgUserService = require("../services/org-user-service");
const userService = require("../services/user-service");

module.exports = {
    index: (req, res, next) => {
        return res.render(views.loginPath);
    },

    login: async (req, res, next) => {
        const { email, password } = req.body;

        // Validations.
        if (!email || !password) {
            req.flash("error", "All fields are required.");
            return res.redirect("/login");
        }

        try {
            // Check if user exists or not.
            const columns = "id, name, email, password, status";
            const user = await userService
                .find({ columns, email })
                .then(([x]) => x);

            if (!user) {
                req.flash("error", "Email or Password is incorrect.");
                return res.redirect("/login");
            }

            if (user.status === "pending") {
                req.flash("error", "User verification is pending.");
                return res.redirect("/login");
            }

            if (user.status === "disabled") {
                req.flash("error", "User account is disabled.");
                return res.redirect("/login");
            }

            const ok = cipher.compare(password, user.password);
            if (!ok) {
                req.flash("error", "Email or Password is incorrect.");
                return res.redirect("/login");
            }

            // All good, create some sessions.
            req.session.userId = user.id;
            req.session.userName = user.name;

            // Check if user is part of org or not.
            // If not then we need to show onboarding flow.
            const { count } = await orgUserService.count({ userId: user.id });

            if (!+count) {
                return res.redirect("/onboarding");
            }

            // If user is part of multiple orgs, then give a screen to select one.
            if (+count > 1) {
                return res.redirect("/choose-org");
            }

            const orgUserColumns = 'role, "orgId"';
            const orgUser = await orgUserService
                .find({ columns: orgUserColumns, userId: user.id })
                .then(([x]) => x);

            // We need two more sessions.
            req.session.userRole = orgUser.role;
            req.session.userOrgId = orgUser.orgId;

            console.log(req.session);

            return res.redirect("/dashboard");
        } catch (err) {
            next(err);
        }
    },
};
