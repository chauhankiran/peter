const sql = require("../../db/sql");
const { views } = require("../../constants/app");
const cipher = require("../../helpers/cipher");

module.exports = {
    register: (req, res, next) => {
        res.render(views.registerPath);
    },

    create: async (req, res, next) => {
        const { firstName, lastName, email, password, confirmPassword } =
            req.body;

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

        if (!password) {
            errors.push("Password is required.");
            validationFailed = true;
        }

        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long.");
            validationFailed = true;
        }

        if (password != confirmPassword) {
            errors.push("Entered password doesn't match");
            validationFailed = true;
        }

        if (validationFailed) {
            res.locals.errors = errors;
            return res.render(views.registerPath, {
                firstName,
                lastName,
                email,
            });
        }

        const passwordHash = cipher.hash(password);
        const token = cipher.token(32);

        try {
            const user = await sql`
                INSERT INTO users (
                    "firstName",
                    "lastName",
                    "email",
                    "passwordHash"
                ) VALUES (
                    ${firstName},
                    ${lastName},
                    ${email},
                    ${passwordHash}
                ) returning id;
            `.then(([x]) => x);

            await sql`
                INSERT INTO "emailVerificationTokens" (
                    "userId",
                    "token",
                    "expiresAt"
                ) VALUES (
                    ${user.id} ,
                    ${token},
                    ${sql`NOW() + INTERVAL '24 hours'`}
                ) returning id;
            `.then(([x]) => x);

            // TEMP.
            const url = `${req.protocol}://${req.get("host")}/verify-email?token=${token}`;
            console.log(url);

            return res.render("accounts/check-email");
        } catch (err) {
            next(err);
        }
    },
};
