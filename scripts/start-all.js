import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const backendDir = join(rootDir, "backend");

console.log("🚀 Starting Yugito full-stack services...");

// 1. Start Backend API on port 4000
const apiProcess = spawn("node", ["server.js"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: "4000" },
});

apiProcess.on("error", (err) => {
  console.error("❌ Failed to start Backend API:", err);
});

// 2. Start Next.js Frontend on port 3001
const frontendProcess = spawn("npx", ["next", "dev", "-p", "3001"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, YUGITO_API_BASE_URL: "http://localhost:4000" },
});

frontendProcess.on("error", (err) => {
  console.error("❌ Failed to start Frontend:", err);
});

function cleanup() {
  console.log("\n🛑 Stopping all services...");
  try {
    apiProcess.kill();
    frontendProcess.kill();
  } catch {}
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
