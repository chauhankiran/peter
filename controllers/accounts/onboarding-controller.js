const sql = require("../../db/sql");

module.exports = {
    onboarding: async (req, res, next) => {
        return res.render("accounts/onboarding");
    },

    setup: async (req, res, next) => {
        const { name } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!name) {
            errors.push("Org name is required.");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;
            return res.render("accounts/onboarding");
        }

        // Create an org first.
        const org = await sql`
            INSERT INTO "orgs" (
                name,
                "createdBy",
                "createdAt"
            ) VALUES (
                ${name},
                ${req.session.userId},
                ${sql`now()`}
            ) returning id
        `.then(([x]) => x);

        // Add user into created org.
        await sql`
            INSERT INTO "userOrgs" (
                "userId",      
                "orgId",
                "role",
                "createdBy",
                "createdAt"
            ) VALUES (
                ${req.session.userId},
                ${org.id},
                'owner',    
                ${req.session.userId},
                ${sql`now()`}
            ) returning id;
        `;

        req.session.orgId = org.id;

        res.redirect("/dashboard");
    },
};
