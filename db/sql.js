const postgres = require('postgres');

module.exports = postgres({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    transform: {
        undefined: null,
    },
    debug: console.log,
    types: {
        date: {
            to: 1114,
            from: [1082, 1083, 1114, 1184],
            serialize: (x) => x,
            parse: (x) => {
                if (x) {
                    const d = new Date(x);
                    return d.toLocaleDateString('en-CA');
                }
                return x;
            },
        },
    },
});
