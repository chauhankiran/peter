const sql = require("../db/sql");

module.exports = {
    choose: async (req, res, next) => {
        try {
            // User has access to multiple orgs.
            // Get the list of the orgs and pass it with template.

            const userId = req.session.userId;

            if (!userId) {
                return res.redirect("/login");
            }

            const orgs = await sql`
        SELECT
          uo."orgId" as id,
          o.name as name,
          uo.role as role
        FROM
          "userOrgs" uo
        JOIN
          "orgs" o
        ON
          o.id = uo."orgId"
        WHERE
          uo."userId" = ${userId} AND
          uo."isActive" = true
        ORDER BY
          o.name ASC
      `;

            if (!orgs || !orgs.length) {
                return res.redirect("/onboarding");
            }

            if (orgs.length === 1) {
                req.session.userOrgId = orgs[0].id;
                req.session.role = orgs[0].role;
                return res.redirect("/dashboard");
            }

            return res.render("accounts/choose-org", { orgs });
        } catch (err) {
            next(err);
        }
    },

    select: async (req, res, next) => {
        const { orgId } = req.body;

        if (!orgId) {
            return res.redirect("/choose-org");
        }

        try {
            const userId = req.session.userId;

            if (!userId) {
                return res.redirect("/login");
            }

            const membership = await sql`
        SELECT
          uo."orgId" as id,
          uo.role as role
        FROM
          "userOrgs" uo
        WHERE
          uo."userId" = ${userId} AND
          uo."orgId" = ${orgId} AND
          uo."isActive" = true
      `.then(([x]) => x);

            if (!membership) {
                req.flash(
                    "error",
                    "You don't have access to the selected organization.",
                );
                return res.redirect("/choose-org");
            }

            req.session.userOrgId = membership.id;
            req.session.role = membership.role;

            return res.redirect("/dashboard");
        } catch (err) {
            next(err);
        }
    },
};
