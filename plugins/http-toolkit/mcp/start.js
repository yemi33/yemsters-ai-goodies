/**
 * Bootstrap — ensures dependencies are installed, then launches the MCP server.
 *
 * Usage:  node start.js
 *
 * On first launch this will automatically run `npm install` so no manual
 * setup is required beyond having Node.js installed.
 */

const { existsSync } = require("node:fs");
const { execSync } = require("node:child_process");
const path = require("node:path");

if (!existsSync(path.resolve(__dirname, "node_modules"))) {
  console.error("[http-toolkit-mcp] First run — installing dependencies...");
  execSync("npm install --no-fund --no-audit", {
    cwd: __dirname,
    stdio: ["ignore", "ignore", "inherit"],
  });
  console.error("[http-toolkit-mcp] Dependencies installed.");
}

require("./dist/index.js");
