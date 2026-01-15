const sql = require("../../db/sql");

module.exports = {
    invite: async (req, res, next) => {
        const token = String(req.query.token || "");

        // Invite token is missing.
        if (!token) {
            const err = {
                code: 400,
                message: "Invite token is missing",
            };
            return res.status(err.code).render("error", { err });
        }

        
        try {
            // Query "invites" table based on token.
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
                    token = ${token}
            `.then(([x]) => x);

            // Invite token is invalid or expired.
            if (
                !invite ||
                invite.status !== "invited" ||
                invite.acceptedAt ||
                new Date(invite.expiresAt).getTime() < Date.now()
            ) {
                const err = {
                    code: 400,
                    message: "Invite token is invalid or expired",
                };
                return res.status(err.code).render("error", { err });
            }

            const user = await sql`
                SELECT
                    id,
                    name,
                    email,
                    status
                FROM
                    "users"
                WHERE
                    email = ${invite.email}
            `.then(([x]) => x);

            if (!user) {
                req.flash(
                    "info",
                    "Please create an account first and then join the project.",
                );
                return res.redirect(
                    `/register?email=${encodeURIComponent(invite.email)}&token=${encodeURIComponent(token)}`,
                );
            }

            if (user.status === "disabled") {
                 const err = {
                    code: 400,
                    message: "Your account has been disabled. Please contact support for assistance.",
                };
                return res.status(err.code).render("error", { err });
            }

            await sql.begin(async (sql) => {
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
                        token = ${token}
                `;
            });

            req.session.userId = user.id;
            req.session.email = user.email;
            req.session.userName = user.name;
            req.session.orgId = invite.orgId;

            if (invite.projectId) {
                return res.redirect(`/projects/${invite.projectId}`);
            }

            return res.redirect("/dashboard");
        } catch (err) {
            next(err);
        }
        
    },
}