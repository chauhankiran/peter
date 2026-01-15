const cipher = require("../../../helpers/cipher");

describe("helpers/cipher (unit)", () => {
    test("token returns a hex string with expected length", () => {
        const t = cipher.token();
        expect(t).toMatch(/^[0-9a-f]+$/);
        expect(t.length).toBe(64); // default size 32 -> 64 hex chars

        const t16 = cipher.token(16);
        expect(t16.length).toBe(32);
    });

    test("hash and compare produce compatible results", () => {
        const pw = "my-secret-password";
        const h = cipher.hash(pw);
        expect(typeof h).toBe("string");
        expect(cipher.compare(pw, h)).toBe(true);
    });
});
