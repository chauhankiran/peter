require("dotenv").config({ quiet: true });
const path = require("path");
const express = require("express");
const favicon = require("serve-favicon");
const helmet = require("helmet");
const morgan = require("morgan");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const csurf = require("csurf");
const redisClient = require("./db/redis-client");
const { RedisStore } = require("connect-redis");
const app = express();

app.set("view engine", "pug");

// CSRF protection will be applied after sessions are configured


app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

const sessionOptions = {
    secret: process.env.SEC_SESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: app.get("env") === "production",
    },
};

// Use a MemoryStore in test environment to avoid a real Redis dependency during tests
if (app.get("env") === "test") {
    sessionOptions.store = new session.MemoryStore();
} else {
    sessionOptions.store = new RedisStore({ client: redisClient });
}

app.use(session(sessionOptions));
app.use(flash());

// CSRF protection
app.use(csurf());
app.use((req, res, next) => {
    // Expose token and param name to views (and to Unpoly via meta tags)
    res.locals.csrfToken = req.csrfToken();
    res.locals.csrfParam = "_csrf";

    next();
});

if (app.get("env") === "development") {
    app.use(morgan("tiny"));
}

// Flash locals.
app.use((req, res, next) => {
    res.locals.info = req.flash("info");
    res.locals.error = req.flash("error");

    // global locals to make sure to don't cause error.
    res.locals.errors = [];

    res.locals.userId = req.session.userId || null;
    res.locals.email = req.session.email || null;
    res.locals.userName = req.session.userName || null;
    res.locals.orgId = req.session.orgId || null;
    res.locals.role = req.session.role || null;

    res.locals.isLoggedIn = Boolean(req.session.userId) || false;

    next();
});

// Load permissions into res.locals for views
const { loadPermissions } = require("./middleware/check-permission");
app.use(loadPermissions);

app.use("/", require("./routes"));

// Test-only endpoints for e2e (only enabled in test env)
if (app.get("env") === "test") {
    app.get("/__test/login", (req, res) => {
        // Seed session with default test values (safe: only available in test env)
        req.session.userId = Number(req.query.userId) || 1;
        req.session.email = req.query.email || "test@example.com";
        req.session.userName = req.query.userName || "Test User";
        req.session.orgId = Number(req.query.orgId) || 1;
        req.session.role = req.query.role || "admin";

        // Redirect to a protected page so the browser gets the session cookie
        return res.redirect("/dashboard");
    });
}

// 404 error
app.use((req, res, next) => {
    const err = {
        code: 404,
        message: "Not Found",
    };

    return res.status(404).render("error", { err });
});

// Error handler
app.use((err, req, res, next) => {
    console.log(err);

    // CSRF token errors
    if (err.code === "EBADCSRFTOKEN") {
        const csrfErr = {
            code: 403,
            message: "Forbidden - invalid CSRF token",
        };

        return res.status(403).render("error", { err: csrfErr });
    }

    err.code = 500;
    err.message = "Internal Server Error";

    return res.status(500).render("error", { err });
});

const main = async () => {
    await redisClient.connect().catch(console.error);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Peter is up and running at http://localhost:${PORT}`);
    });
};

if (require.main === module) {
    main();
}

module.exports = app;
