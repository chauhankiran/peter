const { views } = require("../constants/app");
const sql = require("../db/sql");
const orgService = require("../services/org-service");
const orgUserService = require("../services/org-user-service");

module.exports = {
    onboarding: async (req, res, next) => {
        return res.render(views.onboardingPath);
    },

    setup: async (req, res, next) => {
        const { name } = req.body;

        if (!name) {
            req.flash("error", "Organization name is required.");
            return res.redirect("/onboarding");
        }

        try {
            // Transaction:
            // 1. Create org.
            // 2. Create orgUser with role as owner.
            const [org, orgUser] = await sql.begin(async (sql) => {
                const org = await orgService.create({
                    conn: sql,
                    name,
                    createdBy: req.session.userId,
                });

                const orgUser = await orgUserService.create({
                    conn: sql,
                    userId: req.session.userId,
                    orgId: org.id,
                    role: "owner",
                    createdBy: req.session.userId,
                });

                return [org, orgUser];
            });

            // We need two more sessions.
            req.session.userRole = orgUser.role;
            req.session.userOrgId = org.id;

            res.redirect("/dashboard");
        } catch (err) {
            next(err);
        }
    },
};
