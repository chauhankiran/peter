const crypto = require("crypto");
const bcrypt = require("bcrypt");

module.exports = {
    hash: (password) => {
        return bcrypt.hashSync(password, 12);
    },
    compare: (password, hash) => {
        return bcrypt.compareSync(password, hash);
    },
    token: (size = 32) => {
        return crypto.randomBytes(size).toString("hex");
    },
    sha: (data) => {
        return crypto.createHash("sha256").update(data).digest("hex");
    },
};
