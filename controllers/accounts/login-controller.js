const { views } = require("../../constants/app");
const sql = require("../../db/sql");
const cipher = require("../../helpers/cipher");

module.exports = {
    login: (req, res, next) => {
        return res.render(views.loginPath);
    },

    session: async (req, res, next) => {
        const { email, password } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!email) {
            errors.push("Email is required.");
            validationFailed = true;
        }

        if (!password) {
            errors.push("Password is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;
            return res.render(views.loginPath, {
                email,
            });
        }

        try {
            // Check if user exists or not.
            const user = await sql`
                SELECT
                    id,
                    name,
                    email,
                    "passwordHash",
                    "status"
                FROM 
                    "users"
                WHERE
                    email = ${email}
            `.then(([x]) => x);

            if (!user) {
                res.locals.errors = ["Email or Password is incorrect."];
                return res.render(views.loginPath);
            }

            if (user.status === "pending") {
                res.locals.errors = ["User verification is pending."];
                return res.render(views.loginPath);
            }

            if (user.status === "disabled") {
                res.locals.errors = ["User account is disabled."];
                return res.render(views.loginPath);
            }

            const ok = cipher.compare(password, user.passwordHash);
            if (!ok) {
                errors.push("Email or Password is incorrect.");
                return res.render(views.loginPath);
            }

            // All good.
            req.session.userId = user.id;
            req.session.email = user.email;
            req.session.userName = user.name;

            // Check if user is part of org or not.
            // If not then we need to show onboarding flow.
            const { count } = await sql`
                SELECT
                    count(id)
                FROM
                    "userOrgs"
                WHERE
                    "userId" = ${user.id}
            `.then(([x]) => x);

            if (!+count) {
                return res.redirect("/onboarding");
            }

            // If user is part of multiple orgs, then give a screen to select one.
            if (+count > 1) {
                return res.redirect("/choose-org");
            }

            const org = await sql`
                SELECT
                    id,
                    role
                FROM
                    "userOrgs"
                WHERE
                    "userId" = ${user.id}
            `.then(([x]) => x);

            req.session.role = org.role;
            req.session.orgId = org.id;

            return res.redirect("/dashboard");
        } catch (err) {
            next(err);
        }
    },
};
