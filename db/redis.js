const redis = require('redis');

module.exports = redis.createClient({
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
})