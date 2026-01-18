const sql = require("../db/sql");
const cipher = require("../helpers/cipher");

module.exports = {
    index: (req, res, next) => {
        res.render("reset", {
            title: "Reset password",
        });
    },

    change: async (req, res, next) => {
        const { email } = req.body;

        // Validations
        if (!email) {
            req.flash("error", "Email is required.");
            return res.redirect("/reset");
        }

        try {
            const user = await sql`
                SELECT
                    id,
                    name,
                    email,
                    status
                FROM
                    users
                WHERE
                    email = ${email}
            `.then(([x]) => x);

            // Check if user exists
            if (!user) {
                req.flash(
                    "error",
                    "If that email address is in our database, we will send you an email to reset your password.",
                );
                return res.redirect("/reset");
            }

            // Generate password reset token
            const token = cipher.token(32);
            const hashToken = cipher.sha(token);

            // Store the password reset token
            await sql`
                INSERT INTO "passwordResetTokens" (
                    "userId",
                    "token",
                    "expiresAt"
                ) VALUES (
                    ${user.id},
                    ${hashToken},
                    ${sql`NOW() + INTERVAL '1 hour'`}
                )
            `;

            // TODO: Send password reset email
            const url = `${req.protocol}://${req.get("host")}/change?token=${token}`;
            console.log(url);

            req.flash(
                "info",
                "If that email address is in our database, we will send you an email to reset your password.",
            );
            return res.redirect("/reset");
        } catch (err) {
            return next(err);
        }
    },

    form: async (req, res, next) => {
        const { token } = req.query;

        // Validations
        if (!token) {
            req.flash("error", "Invalid or expired password reset token.");
            return res.redirect("/reset");
        }

        // Check if token exists
        const hashToken = cipher.sha(token);
        const record = await sql`
            SELECT
                id,
                "usedAt"
            FROM
                "passwordResetTokens"
            WHERE
                token = ${hashToken}
        `.then(([x]) => x);

        if (!record) {
            req.flash("error", "Invalid or expired password reset token.");
            return res.redirect("/reset");
        }

        // Check if token is already used
        if (record.usedAt) {
            req.flash("error", "Invalid or expired password reset token.");
            return res.redirect("/reset");
        }

        res.render("change", {
            title: "Change password",
            token,
        });
    },

    update: async (req, res, next) => {
        const { token, password, confirmPassword } = req.body;

        // Validations
        if (!token || !password || !confirmPassword) {
            req.flash("error", "All fields are required.");
            return res.redirect(`/change?token=${token}`);
        }

        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match.");
            return res.redirect(`/change?token=${token}`);
        }

        try {
            const hashToken = cipher.sha(token);

            const record = await sql`
                SELECT
                    prt.id,
                    prt."userId",
                    prt."expiresAt",
                    u.email
                FROM
                    "passwordResetTokens" prt
                JOIN    
                    users u ON u.id = prt."userId"
                WHERE
                    prt.token = ${hashToken}
            `.then(([x]) => x);

            // Check if token is valid
            const now = new Date();
            if (!record || now > record.expiresAt) {
                req.flash("error", "Invalid or expired password reset token.");
                return res.redirect("/reset");
            }

            const hashPassword = cipher.hash(password);

            // Transaction:
            // 1. Update user's password
            // 2. Update reset password token for usedAt
            await sql.begin(async (sql) => {
                // 1. Update user's password
                await sql`
                    UPDATE
                        users
                    SET
                        password = ${hashPassword}
                    WHERE
                        id = ${record.userId}
                `;

                // 2. Update reset password token for usedAt
                await sql`
                    UPDATE
                        "passwordResetTokens"
                    SET
                        "usedAt" = ${sql`NOW()`}
                    WHERE
                        id = ${record.id}
                `;
            });

            req.flash(
                "info",
                "Your password has been updated. You can now log in.",
            );
            return res.redirect("/login");
        } catch (err) {
            return next(err);
        }
    },
};
