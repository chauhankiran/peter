const isAuth = require("../../../middleware/is-auth");

describe("is-auth middleware (unit)", () => {
    test("returns 404 and renders error when not authenticated", () => {
        const req = { session: {} };
        const res = { status: jest.fn().mockReturnThis(), render: jest.fn() };
        const next = jest.fn();

        isAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.render).toHaveBeenCalledWith("error", expect.any(Object));
        expect(next).not.toHaveBeenCalled();
    });

    test("calls next when authenticated", () => {
        const req = { session: { userId: 1 } };
        const res = {};
        const next = jest.fn();

        isAuth(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
