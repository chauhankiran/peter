const sql = require("../../db/sql");
const { views } = require("../../constants/app");
const cipher = require("../../helpers/cipher");

module.exports = {
    register: (req, res, next) => {
        const inviteToken = req.query.token;
        const inviteEmail = req.query.email;

        res.render(views.registerPath, {
            inviteToken,
            inviteEmail,
        });
    },

    create: async (req, res, next) => {
        const { name, email, password, confirmPassword, inviteToken } =
            req.body;

        let validationFailed = false;
        let errors = [];
        if (!name) {
            errors.push("Name is required.");
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
                name,
                email,
                inviteToken,
            });
        }

        const passwordHash = cipher.hash(password);
        const token = cipher.token(32);

        try {
            if (inviteToken) {
                await sql.begin(async (sql) => {
                    const invite = await sql`
                        SELECT
                            id,
                            "orgId",
                            "projectId",
                            email,
                            role,
                            status,
                            "expiresAt",
                            "acceptedAt"
                        FROM
                            "invites"
                        WHERE
                            token = ${inviteToken}
                    `.then(([x]) => x);

                    if (
                        !invite ||
                        invite.status !== "invited" ||
                        invite.acceptedAt ||
                        new Date(invite.expiresAt).getTime() < Date.now() ||
                        String(invite.email).toLowerCase() !==
                            String(email).toLowerCase()
                    ) {
                        const err = {
                            code: 400,
                            message: "Invite token is invalid or expired",
                        };
                        return res.status(err.code).render("error", { err });
                    }

                    const user = await sql`
                        INSERT INTO users (
                            name,
                            "email",
                            "passwordHash",
                            "isEmailVerified",
                            "verifiedAt",
                            "status"
                        ) VALUES (
                            ${name},
                            ${email},
                            ${passwordHash},
                            true,
                            ${sql`now()`},
                            'active'
                        ) returning id;
                    `.then(([x]) => x);

                    const orgMembership = await sql`
                        SELECT
                            id
                        FROM
                            "userOrgs"
                        WHERE
                            "userId" = ${user.id} AND
                            "orgId" = ${invite.orgId}
                    `.then(([x]) => x);

                    if (!orgMembership) {
                        await sql`
                            INSERT INTO "userOrgs" (
                                "userId",
                                "orgId",
                                role,
                                "createdBy",
                                "createdAt"
                            ) VALUES (
                                ${user.id},
                                ${invite.orgId},
                                ${invite.role},
                                ${user.id},
                                ${sql`now()`}
                            )
                        `;
                    }

                    if (invite.projectId) {
                        const projectMembership = await sql`
                            SELECT
                                1
                            FROM
                                "projectMembers"
                            WHERE
                                "projectId" = ${invite.projectId} AND
                                "userId" = ${user.id}
                        `.then(([x]) => x);

                        if (!projectMembership) {
                            await sql`
                                INSERT INTO "projectMembers" (
                                    "projectId",
                                    "userId",
                                    role,
                                    "createdBy",
                                    "createdAt"
                                ) VALUES (
                                    ${invite.projectId},
                                    ${user.id},
                                    ${invite.role},
                                    ${user.id},
                                    ${sql`now()`}
                                )
                            `;
                        }
                    }

                    await sql`
                        UPDATE
                            "invites"
                        SET
                            status = 'accepted',
                            "acceptedAt" = ${sql`now()`},
                            "invitedUserId" = ${user.id},
                            "updatedBy" = ${user.id},
                            "updatedAt" = ${sql`now()`}
                        WHERE
                            id = ${invite.id} AND
                            token = ${inviteToken}
                    `;

                    const createdUser = await sql`
                        SELECT
                            id,
                            name,
                            email
                        FROM
                            "users"
                        WHERE
                            id = ${user.id}
                    `.then(([x]) => x);

                    req.session.userId = createdUser.id;
                    req.session.email = createdUser.email;
                    req.session.userName = createdUser.name;
                    req.session.orgId = invite.orgId;
                    req.session.role = invite.role;

                    if (invite.projectId) {
                        return res.redirect(`/projects/${invite.projectId}`);
                    }

                    return res.redirect("/dashboard");
                });

                return;
            }

            const user = await sql`
                INSERT INTO users (
                    name,
                    email,
                    "passwordHash"
                ) VALUES (
                    ${name},
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

            return res.render(views.checkEmailPath);
        } catch (err) {
            if (err.code === "23505") {
                res.locals.errors = ["Email is already in use."];
                return res.render(views.registerPath);
            }

            next(err);
        }
    },
};
