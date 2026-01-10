const sql = require("../db/sql");
const { views } = require("../constants/app");
const cipher = require("../helpers/cipher");

module.exports = {
    index: async (req, res, next) => {
        const userId = req.session.userId;

        try {
            const user = await sql`
                SELECT
                    id,
                    "firstName",
                    "lastName",
                    email
                FROM
                    users
                WHERE
                    id = ${userId}
            `.then(([x]) => x);

            if (!user) {
                const err = {
                    code: 404,
                    message: "User not found.",
                };
                return res.status(404).render("error", { err });
            }

            return res.render(views.settingsPath, { user });
        } catch (err) {
            next(err);
        }
    },

    updateProfile: async (req, res, next) => {
        const userId = req.session.userId;
        const { firstName, lastName, email } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!firstName) {
            errors.push("First name is required.");
            validationFailed = true;
        }

        if (!lastName) {
            errors.push("Last name is required.");
            validationFailed = true;
        }

        if (!email) {
            errors.push("Email is required.");
            validationFailed = true;
        }

        try {
            const user = await sql`
                SELECT
                    id,
                    "firstName",
                    "lastName",
                    email
                FROM
                    users
                WHERE
                    id = ${userId}
            `.then(([x]) => x);

            if (!user) {
                const err = {
                    code: 404,
                    message: "User not found.",
                };
                return res.status(404).render("error", { err });
            }

            const normalizedEmail = String(email || "").trim().toLowerCase();

            const emailTaken = await sql`
                SELECT
                    1
                FROM
                    users
                WHERE
                    lower(email) = ${normalizedEmail} AND
                    id != ${userId}
            `.then(([x]) => x);

            if (emailTaken) {
                errors.push("Email is already in use.");
                validationFailed = true;
            }

            const viewUser = {
                id: user.id,
                firstName: firstName || "",
                lastName: lastName || "",
                email: email || "",
            };

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render(views.settingsPath, { user: viewUser });
            }

            const updatedUser = await sql`
                UPDATE
                    users
                SET
                    "firstName" = ${firstName},
                    "lastName" = ${lastName},
                    email = ${normalizedEmail},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${userId}
                RETURNING
                    id,
                    "firstName",
                    "lastName",
                    email
            `.then(([x]) => x);

            req.session.email = updatedUser.email;
            req.session.userName =
                updatedUser.firstName + " " + updatedUser.lastName;

            req.flash("info", "Profile updated successfully.");
            return res.redirect("/settings");
        } catch (err) {
            if (err.code === "23505") {
                res.locals.errors = ["Email is already in use."];
                return res.render(views.settingsPath, {
                    user: {
                        id: userId,
                        firstName: firstName || "",
                        lastName: lastName || "",
                        email: email || "",
                    },
                });
            }

            next(err);
        }
    },

    updatePassword: async (req, res, next) => {
        const userId = req.session.userId;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        let validationFailed = false;
        let errors = [];

        if (!currentPassword) {
            errors.push("Current password is required.");
            validationFailed = true;
        }

        if (!newPassword) {
            errors.push("New password is required.");
            validationFailed = true;
        }

        if (newPassword && newPassword.length < 8) {
            errors.push("Password must be at least 8 characters long.");
            validationFailed = true;
        }

        if (newPassword !== confirmNewPassword) {
            errors.push("New passwords do not match.");
            validationFailed = true;
        }

        try {
            const user = await sql`
                SELECT
                    id,
                    "firstName",
                    "lastName",
                    email,
                    "passwordHash"
                FROM
                    users
                WHERE
                    id = ${userId}
            `.then(([x]) => x);

            if (!user) {
                const err = {
                    code: 404,
                    message: "User not found.",
                };
                return res.status(404).render("error", { err });
            }

            const ok = cipher.compare(currentPassword, user.passwordHash);
            if (!ok) {
                errors.push("Current password is incorrect.");
                validationFailed = true;
            }

            if (validationFailed) {
                res.locals.errors = errors;
                return res.render(views.settingsPath, {
                    user: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                    },
                });
            }

            const passwordHash = cipher.hash(newPassword);

            await sql`
                UPDATE
                    users
                SET
                    "passwordHash" = ${passwordHash},
                    "updatedBy" = ${userId},
                    "updatedAt" = now()
                WHERE
                    id = ${userId}
            `;

            req.flash("info", "Password updated successfully.");
            return res.redirect("/settings");
        } catch (err) {
            next(err);
        }
    },
};
