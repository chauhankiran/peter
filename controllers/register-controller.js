const sql = require("../db/sql");
const { views } = require("../constants/app");
const cipher = require("../helpers/cipher");

module.exports = {
    index: (req, res, next) => {
        // Registration can be done via
        // 1. Normal registration from the /register
        // 2. Via invite. In case of invite, we need token and email to associate.
        const inviteToken = req.query.token;
        const inviteEmail = req.query.email;

        return res.render(views.registerPath, {
            inviteToken,
            inviteEmail,
        });
    },

    register: async (req, res, next) => {
        const { name, email, password, confirmPassword, inviteToken } =
            req.body;

        console.log({ name, email, password, confirmPassword, inviteToken });

        // Validations.
        if (!name || !email || !password || !confirmPassword) {
            req.flash("error", "All fields are required.");
            return res.redirect("/register");
        }

        if (password.length < 8) {
            req.flash("error", "Password must be at least 8 characters long.");
            return res.redirect("/register");
        }

        if (password !== confirmPassword) {
            req.flash("error", "Entered password doesn't match");
            return res.redirect("/register");
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
                    req.session.userOrgId = invite.orgId;
                    req.session.role = invite.role;

                    if (invite.projectId) {
                        return res.redirect(`/projects/${invite.projectId}`);
                    }

                    return res.redirect("/dashboard");
                });

                return;
            }

            // TODO: Add transaction.
            const user = await sql`
                INSERT INTO users (
                    name,
                    email,
                    "password"
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
                    ${cipher.sha(token)},
                    ${sql`NOW() + INTERVAL '24 hours'`}
                ) returning id;
            `.then(([x]) => x);

            // TEMP.
            const url = `${req.protocol}://${req.get("host")}/verify-email?token=${token}`;
            console.log(url);

            return res.render(views.checkEmailPath);
        } catch (err) {
            if (err.code === "23505") {
                req.flash("error", "Email is already in use.");
                return res.redirect("/register");
            }

            next(err);
        }
    },
};
