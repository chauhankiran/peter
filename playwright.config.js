// @type {import('@playwright/test').PlaywrightTestConfig}
const config = {
    testDir: "tests/e2e",
    timeout: 30 * 1000,
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 },
        baseURL: "http://localhost:3001",
    },
    webServer: {
        command: "NODE_ENV=test PORT=3001 node app.js",
        url: "http://localhost:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
};

module.exports = config;
