const { views } = require("../constants/app");
const sql = require("../db/sql");
const cipher = require("../helpers/cipher");

module.exports = {
    verify: async (req, res, next) => {
        const token = String(req.query.token || "");

        // Verification token is missing.
        if (!token) {
            const err = {
                code: 400,
                message: "Verification token is missing",
            };
            return res.status(err.code).render("error", { err });
        }

        try {
            const verification = await sql`
                SELECT
                    "id",
                    "userId",
                    "token",
                    "expiresAt",
                    "usedAt"
                FROM
                    "emailVerificationTokens"
                WHERE
                    token = ${cipher.sha(token)}
            `.then(([x]) => x);

            // Verification token is invalid.
            if (!verification) {
                const err = {
                    code: 400,
                    message: "Verification token is invalid",
                };
                return res.status(err.code).render("error", { err });
            }

            // Verification token is already verified.
            if (verification.usedAt) {
                const err = {
                    code: 400,
                    message: "Verification token is already verified",
                };
                return res.status(err.code).render("error", { err });
            }

            // Verification link is expired.
            if (new Date(verification.expiresAt).getTime() < Date.now()) {
                const err = {
                    code: 400,
                    message: "Verification link is expired",
                };
                return res.status(err.code).render("error", { err });
            }

            if (!verification.usedAt) {
                // TODO: Add transaction.
                await sql`
                    UPDATE 
                        "emailVerificationTokens"
                    SET
                        "usedAt" = ${sql`now()`}
                    WHERE
                        id = ${verification.id} AND
                        token = ${verification.token}
                `.then(([x]) => x);

                await sql`
                    UPDATE
                        "users"
                    SET
                        "status" = 'active'
                    WHERE
                        "id" = ${verification.userId}
                `.then(([x]) => x);
            }

            // All good.
            const user = await sql`
                SELECT
                    id,
                    name,
                    email,
                    "password",
                    "status"
                FROM 
                    "users"
                WHERE
                    "id" = ${verification.userId}
            `.then(([x]) => x);

            req.session.userId = user.id;
            req.session.userName = user.name;

            return res.render(views.verifyEmailPath);
        } catch (err) {
            next(err);
        }
    },
};
