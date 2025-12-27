const { views } = require("../constants/app");

module.exports = {
    index: (req, res, next) => {
        res.render(views.homePath);
    },
};
