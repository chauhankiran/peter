jest.mock("../../../db/sql", () => ({ begin: jest.fn() }));

const sql = require("../../../db/sql");
const projectsController = require("../../../controllers/projects-controller");

describe("projects-controller.create (unit)", () => {
    beforeEach(() => {
        sql.begin.mockReset();
    });

    test("create happy path calls transaction and redirects to /projects", async () => {
        const innerSql = jest
            .fn()
            .mockImplementationOnce(() => Promise.resolve([{ id: 123 }])) // create project
            .mockImplementation(() => Promise.resolve([])); // other inserts

        sql.begin.mockImplementation(async (cb) => {
            await cb(innerSql);
        });

        const req = {
            body: { name: "My Project" },
            session: { orgId: 1, userId: 2 },
            flash: jest.fn(),
        };
        const res = {
            redirect: jest.fn(),
            locals: {},
            status: jest.fn().mockReturnThis(),
            render: jest.fn(),
        };
        const next = jest.fn();

        await projectsController.create(req, res, next);

        expect(req.flash).toHaveBeenCalledWith(
            "info",
            "Project created successfully.",
        );
        expect(res.redirect).toHaveBeenCalledWith("/projects");
    });
});
