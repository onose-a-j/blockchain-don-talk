import { defineConfig, devices } from "@playwright/test";

// Runs against the static export in ./out, served locally. Use `npm run e2e`, which starts anvil,
// deploys the contracts and builds the site first (see e2e/run.sh).
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory out",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "ignore",
  },
});
