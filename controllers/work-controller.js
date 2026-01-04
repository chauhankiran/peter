module.exports = {
    index: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },

    new: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },

    create: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },

    show: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },

    edit: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },

    update: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },

    destroy: async (req, res, next) => {
        const err = {
            code: 504,
            message: "Not Implemented",
        };

        return res.status(404).render("error", { err });
    },
};
