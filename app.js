require("dotenv").config({ quiet: true });
const path = require("path");
const express = require("express");
const favicon = require("serve-favicon");
const helmet = require("helmet");
const morgan = require("morgan");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const redisClient = require("./db/redis-client");
const { RedisStore } = require("connect-redis");
const app = express();

app.set("view engine", "pug");

app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SEC_SESSION,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // TODO
        },
    }),
);
app.use(flash());

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

app.use("/", require("./routes"));

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
