const sql = require("../db/sql");

/**
 * Middleware to check org-level and user-level permissions
 * @param {string} module - The module name (projects, work, milestones, targets, comments, attachments)
 * @param {string} action - The action (create, read, update, delete)
 */
const checkPermission = (module, action) => {
    return async (req, res, next) => {
        const orgId = req.session.orgId;
        const userId = req.session.userId;
        const role = req.session.role;

        try {
            // Check org-level permissions (module enabled/disabled) - applies to ALL users including admin/owner
            const orgPermissions = await sql`
                SELECT
                    "projectsEnabled",
                    "workEnabled",
                    "milestonesEnabled",
                    "targetsEnabled",
                    "commentsEnabled",
                    "attachmentsEnabled"
                FROM
                    "orgPermissions"
                WHERE
                    "orgId" = ${orgId}
            `.then(([x]) => x);

            // Check if module is enabled at org level - this applies to ALL users including admin/owner
            if (orgPermissions) {
                const moduleEnabledKey = `${module}Enabled`;
                if (orgPermissions[moduleEnabledKey] === false) {
                    req.flash(
                        "error",
                        `${module.charAt(0).toUpperCase() + module.slice(1)} module is disabled for this organization.`,
                    );
                    return res.redirect("/dashboard");
                }
            }

            // Admin and owner bypass user-level permission checks
            if (role === "admin" || role === "owner") {
                return next();
            }

            // Check user-level permissions
            const userPermissions = await sql`
                SELECT
                    
                    "projectsCreate", "projectsRead", "projectsUpdate", "projectsDelete",
                    "workCreate", "workRead", "workUpdate", "workDelete",
                    "milestonesCreate", "milestonesRead", "milestonesUpdate", "milestonesDelete",
                    "targetsCreate", "targetsRead", "targetsUpdate", "targetsDelete",
                    "commentsCreate", "commentsRead", "commentsUpdate", "commentsDelete",
                    "attachmentsCreate", "attachmentsRead", "attachmentsUpdate", "attachmentsDelete"
                FROM
                    "userPermissions"
                WHERE
                    "orgId" = ${orgId} AND
                    "userId" = ${userId}
            `.then(([x]) => x);

            // If no user permissions record exists, use defaults based on role
            if (!userPermissions) {
                // Default: normal users can CRUD projects, work, comments, attachments
                // but only read milestones and targets (no create/update/delete)
                const defaultAllowed = {
                    projects: {
                        create: true,
                        read: true,
                        update: true,
                        delete: true,
                    },
                    work: {
                        create: true,
                        read: true,
                        update: true,
                        delete: true,
                    },
                    milestones: {
                        create: false,
                        read: true,
                        update: false,
                        delete: false,
                    },
                    targets: {
                        create: false,
                        read: true,
                        update: false,
                        delete: false,
                    },
                    comments: {
                        create: true,
                        read: true,
                        update: true,
                        delete: true,
                    },
                    attachments: {
                        create: true,
                        read: true,
                        update: true,
                        delete: true,
                    },
                };

                if (
                    !defaultAllowed[module] ||
                    !defaultAllowed[module][action]
                ) {
                    req.flash(
                        "error",
                        "You don't have permission to perform this action.",
                    );
                    return res.redirect("back");
                }
                return next();
            }

            // Check specific permission
            const permissionKey = `${module}${action.charAt(0).toUpperCase() + action.slice(1)}`;
            if (userPermissions[permissionKey] === false) {
                req.flash(
                    "error",
                    "You don't have permission to perform this action.",
                );
                return res.redirect("back");
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Load permissions into session for use in views
 */
const loadPermissions = async (req, res, next) => {
    if (!req.session.userId || !req.session.orgId) {
        return next();
    }

    const orgId = req.session.orgId;
    const userId = req.session.userId;
    const role = req.session.role;

    try {
        // Get org permissions - applies to ALL users including admin/owner
        const orgPermissions = await sql`
            SELECT
                "projectsEnabled",
                "workEnabled",
                "milestonesEnabled",
                "targetsEnabled",
                "commentsEnabled",
                "attachmentsEnabled"
            FROM
                "orgPermissions"
            WHERE
                "orgId" = ${orgId}
        `.then(([x]) => x);

        res.locals.orgPermissions = orgPermissions || {
            projectsEnabled: true,
            workEnabled: true,
            milestonesEnabled: true,
            targetsEnabled: true,
            commentsEnabled: true,
            attachmentsEnabled: true,
        };

        // Admin and owner have all user-level permissions, but still bound by org-level
        if (role === "admin" || role === "owner") {
            res.locals.permissions = {
                projects: {
                    create: res.locals.orgPermissions.projectsEnabled,
                    read: res.locals.orgPermissions.projectsEnabled,
                    update: res.locals.orgPermissions.projectsEnabled,
                    delete: res.locals.orgPermissions.projectsEnabled,
                },
                work: {
                    create: res.locals.orgPermissions.workEnabled,
                    read: res.locals.orgPermissions.workEnabled,
                    update: res.locals.orgPermissions.workEnabled,
                    delete: res.locals.orgPermissions.workEnabled,
                },
                milestones: {
                    create: res.locals.orgPermissions.milestonesEnabled,
                    read: res.locals.orgPermissions.milestonesEnabled,
                    update: res.locals.orgPermissions.milestonesEnabled,
                    delete: res.locals.orgPermissions.milestonesEnabled,
                },
                targets: {
                    create: res.locals.orgPermissions.targetsEnabled,
                    read: res.locals.orgPermissions.targetsEnabled,
                    update: res.locals.orgPermissions.targetsEnabled,
                    delete: res.locals.orgPermissions.targetsEnabled,
                },
                comments: {
                    create: res.locals.orgPermissions.commentsEnabled,
                    read: res.locals.orgPermissions.commentsEnabled,
                    update: res.locals.orgPermissions.commentsEnabled,
                    delete: res.locals.orgPermissions.commentsEnabled,
                },
                attachments: {
                    create: res.locals.orgPermissions.attachmentsEnabled,
                    read: res.locals.orgPermissions.attachmentsEnabled,
                    update: res.locals.orgPermissions.attachmentsEnabled,
                    delete: res.locals.orgPermissions.attachmentsEnabled,
                },
            };
            return next();
        }

        // Get user permissions
        const userPermissions = await sql`
            SELECT
                
                "projectsCreate", "projectsRead", "projectsUpdate", "projectsDelete",
                "workCreate", "workRead", "workUpdate", "workDelete",
                "milestonesCreate", "milestonesRead", "milestonesUpdate", "milestonesDelete",
                "targetsCreate", "targetsRead", "targetsUpdate", "targetsDelete",
                "commentsCreate", "commentsRead", "commentsUpdate", "commentsDelete",
                "attachmentsCreate", "attachmentsRead", "attachmentsUpdate", "attachmentsDelete"
            FROM
                "userPermissions"
            WHERE
                "orgId" = ${orgId} AND
                "userId" = ${userId}
        `.then(([x]) => x);

        if (userPermissions) {
            res.locals.permissions = {
                projects: {
                    create:
                        userPermissions.projectsCreate &&
                        res.locals.orgPermissions.projectsEnabled,
                    read:
                        userPermissions.projectsRead &&
                        res.locals.orgPermissions.projectsEnabled,
                    update:
                        userPermissions.projectsUpdate &&
                        res.locals.orgPermissions.projectsEnabled,
                    delete:
                        userPermissions.projectsDelete &&
                        res.locals.orgPermissions.projectsEnabled,
                },
                work: {
                    create:
                        userPermissions.workCreate &&
                        res.locals.orgPermissions.workEnabled,
                    read:
                        userPermissions.workRead &&
                        res.locals.orgPermissions.workEnabled,
                    update:
                        userPermissions.workUpdate &&
                        res.locals.orgPermissions.workEnabled,
                    delete:
                        userPermissions.workDelete &&
                        res.locals.orgPermissions.workEnabled,
                },
                milestones: {
                    create:
                        userPermissions.milestonesCreate &&
                        res.locals.orgPermissions.milestonesEnabled,
                    read:
                        userPermissions.milestonesRead &&
                        res.locals.orgPermissions.milestonesEnabled,
                    update:
                        userPermissions.milestonesUpdate &&
                        res.locals.orgPermissions.milestonesEnabled,
                    delete:
                        userPermissions.milestonesDelete &&
                        res.locals.orgPermissions.milestonesEnabled,
                },
                targets: {
                    create:
                        userPermissions.targetsCreate &&
                        res.locals.orgPermissions.targetsEnabled,
                    read:
                        userPermissions.targetsRead &&
                        res.locals.orgPermissions.targetsEnabled,
                    update:
                        userPermissions.targetsUpdate &&
                        res.locals.orgPermissions.targetsEnabled,
                    delete:
                        userPermissions.targetsDelete &&
                        res.locals.orgPermissions.targetsEnabled,
                },
                comments: {
                    create:
                        userPermissions.commentsCreate &&
                        res.locals.orgPermissions.commentsEnabled,
                    read:
                        userPermissions.commentsRead &&
                        res.locals.orgPermissions.commentsEnabled,
                    update:
                        userPermissions.commentsUpdate &&
                        res.locals.orgPermissions.commentsEnabled,
                    delete:
                        userPermissions.commentsDelete &&
                        res.locals.orgPermissions.commentsEnabled,
                },
                attachments: {
                    create:
                        userPermissions.attachmentsCreate &&
                        res.locals.orgPermissions.attachmentsEnabled,
                    read:
                        userPermissions.attachmentsRead &&
                        res.locals.orgPermissions.attachmentsEnabled,
                    update:
                        userPermissions.attachmentsUpdate &&
                        res.locals.orgPermissions.attachmentsEnabled,
                    delete:
                        userPermissions.attachmentsDelete &&
                        res.locals.orgPermissions.attachmentsEnabled,
                },
            };
        } else {
            // Default permissions for normal users
            res.locals.permissions = {
                projects: {
                    create: res.locals.orgPermissions.projectsEnabled,
                    read: res.locals.orgPermissions.projectsEnabled,
                    update: res.locals.orgPermissions.projectsEnabled,
                    delete: res.locals.orgPermissions.projectsEnabled,
                },
                work: {
                    create: res.locals.orgPermissions.workEnabled,
                    read: res.locals.orgPermissions.workEnabled,
                    update: res.locals.orgPermissions.workEnabled,
                    delete: res.locals.orgPermissions.workEnabled,
                },
                milestones: {
                    create: false,
                    read: res.locals.orgPermissions.milestonesEnabled,
                    update: false,
                    delete: false,
                },
                targets: {
                    create: false,
                    read: res.locals.orgPermissions.targetsEnabled,
                    update: false,
                    delete: false,
                },
                comments: {
                    create: res.locals.orgPermissions.commentsEnabled,
                    read: res.locals.orgPermissions.commentsEnabled,
                    update: res.locals.orgPermissions.commentsEnabled,
                    delete: res.locals.orgPermissions.commentsEnabled,
                },
                attachments: {
                    create: res.locals.orgPermissions.attachmentsEnabled,
                    read: res.locals.orgPermissions.attachmentsEnabled,
                    update: res.locals.orgPermissions.attachmentsEnabled,
                    delete: res.locals.orgPermissions.attachmentsEnabled,
                },
            };
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { checkPermission, loadPermissions };
