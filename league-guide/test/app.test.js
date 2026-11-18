const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "campus-connect-"));
process.env.DATA_FILE = path.join(testDir, "content.json");
process.env.ADMIN_EMAIL = "admin@test.com";
process.env.ADMIN_PASSWORD = "test-password";
process.env.SESSION_SECRET = "test-secret";

const request = require("supertest");
const app = require("../server");

test("public homepage shows published content only", async () => {
  const response = await request(app).get("/");
  assert.equal(response.status, 200);
  assert.match(response.text, /Ahri Mid Guide/);
  assert.doesNotMatch(response.text, /Jinx ADC Guide/);
});

test("admin dashboard redirects visitors to login", async () => {
  const response = await request(app).get("/admin");
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, "/login");
});

test("admin can log in and see dashboard", async () => {
  const agent = request.agent(app);
  const login = await agent.post("/login").type("form").send({ email: "admin@test.com", password: "test-password" });
  assert.equal(login.status, 302);
  assert.equal(login.headers.location, "/admin");
  const dashboard = await agent.get("/admin");
  assert.equal(dashboard.status, 200);
  assert.match(dashboard.text, /Guide dashboard/);
});

test("contact form stores a message", async () => {
  const response = await request(app).post("/contact").type("form").send({ name: "Josh", email: "josh@example.com", message: "Can I add an event?" });
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, "/contact");
});
