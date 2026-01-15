jest.mock("../../../db/sql", () => jest.fn());
jest.mock("../../../helpers/cipher", () => ({ compare: jest.fn() }));

const sql = require("../../../db/sql");
const cipher = require("../../../helpers/cipher");
const loginController = require("../../../controllers/accounts/login-controller");
const { views } = require("../../../constants/app");

describe("accounts/login-controller (unit)", () => {
    beforeEach(() => {
        sql.mockReset();
        cipher.compare.mockReset();
    });

    test("login renders the login view", () => {
        const req = {};
        const res = { render: jest.fn() };

        loginController.login(req, res);

        expect(res.render).toHaveBeenCalledWith(views.loginPath);
    });

    test("session happy path sets session and redirects to dashboard", async () => {
        // 1) select user
        sql.mockImplementationOnce(() =>
            Promise.resolve([
                {
                    id: 1,
                    name: "Test User",
                    email: "test@example.com",
                    passwordHash: "hash",
                    status: "active",
                },
            ]),
        )
            // 2) count user orgs
            .mockImplementationOnce(() => Promise.resolve([{ count: 1 }]))
            // 3) fetch org membership
            .mockImplementationOnce(() =>
                Promise.resolve([{ id: 1, role: "admin" }]),
            );

        cipher.compare.mockReturnValue(true);

        const req = {
            body: { email: "test@example.com", password: "secret" },
            session: {},
            flash: jest.fn(),
        };
        const res = { render: jest.fn(), redirect: jest.fn(), locals: {} };
        const next = jest.fn();

        await loginController.session(req, res, next);

        expect(req.session.userId).toBe(1);
        expect(req.session.email).toBe("test@example.com");
        expect(req.session.userName).toBe("Test User");
        expect(req.session.role).toBe("admin");
        expect(req.session.orgId).toBe(1);
        expect(res.redirect).toHaveBeenCalledWith("/dashboard");
    });
});
