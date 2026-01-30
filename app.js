require('dotenv').config({ quiet: true });
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const redis = require('./db/redis');
const sql = require('./db/sql');
const { RedisStore } = require('connect-redis');
const cipher = require('./helpers/cipher');
const { isAuth } = require('./middleware');
const app = express();

app.set('view engine', 'pug');

app.use(helmet());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

app.use(
    session({
        secret: process.env.SEC_SESSION,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: app.get('env') === 'production',
        },
        store: new RedisStore({ client: redis }),
    }),
);
app.use(flash());

app.use((req, res, next) => {
    // flash
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');

    res.locals.userId = req.session.userId || null;
    res.locals.userName = req.session.userName || null;

    next();
});

// Home
app.get('/', (req, res, next) => {
    return res.render('index', {
        title: 'Peter',
    });
});

// Login
app.get('/login', (req, res, next) => {
    return res.render('auth/login', {
        title: 'Login',
    });
});
app.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    // All good. We can proceed with login.

    try {
        const user = await sql`
            SELECT
                id,
                name,
                email,
                password
            FROM
                "users"
            WHERE
                email = ${email}
        `.then(([x]) => x);

        if (!user) {
            req.flash('error', 'User with given email not found.');
            return res.redirect('/login');
        }

        const ok = cipher.compare(password, user.password);

        if (!ok) {
            req.flash('error', 'Email or password is incorrect.');
            return res.redirect('/login');
        }

        req.session.userId = user.id;
        req.session.userName = user.name;

        return res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

// Register
app.get('/register', (req, res, next) => {
    return res.render('auth/register', {
        title: 'Register',
    });
});
app.post('/register', async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/register');
    }

    if (password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters long.');
        return res.redirect('/register');
    }

    if (password !== confirmPassword) {
        req.flash('error', "Entered password doesn't match.");
        return res.redirect('/register');
    }

    // All good. We can proceed with user creation now.
    const passwordHash = cipher.hash(password);

    try {
        await sql`
            INSERT INTO "users" (
                name,
                email,
                password
            ) VALUES (
                ${name},
                ${email},
                ${passwordHash}
            )
        `;

        req.flash('info', 'Account is created successfully.');
        return res.redirect('/login');
    } catch (err) {
        next(err);
    }
});

// Dashboard
app.get('/dashboard', isAuth, (req, res, next) => {
    res.render('dashboard', {
        title: 'Dashboard',
    });
});

app.use('/projects', require('./project'));
app.use('/projects/:projectId/works', require('./work'));

// Logout
app.get('/logout', isAuth, (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            next(err);
        }

        return res.redirect('/');
    });
});

const main = async () => {
    await redis.connect().catch(console.log);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
};
if (require.main === module) {
    main();
}

module.exports = app;
