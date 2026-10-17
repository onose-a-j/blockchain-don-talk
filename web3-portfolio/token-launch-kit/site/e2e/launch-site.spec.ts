import { expect, test } from "@playwright/test";
import { injectWallet, rpc, STRANGER, TEAM } from "./wallet";

// Every test starts from the freshly deployed chain state: snapshot before, revert after.
let snapshot: string;
test.beforeEach(async () => {
  snapshot = await rpc("evm_snapshot");
});
test.afterEach(async () => {
  await rpc("evm_revert", [snapshot]);
});

test("shows testnet banner and token facts without a wallet", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note")).toHaveText("Portfolio demo on Base Sepolia testnet. Not a real token.");
  await expect(page.getByText("Launch Kit Demo")).toBeVisible();
  await expect(page.getByText("1,000,000,000 LKD")).toBeVisible();
  await expect(page.getByText("Connect a wallet to see your balance.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Claim unlocked tokens" })).toBeDisabled();
});

test("copy button copies the token address", async ({ page, context }, info) => {
  test.skip(info.project.name === "mobile", "clipboard permission is desktop-only in headless chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const address = (await page.getByLabel("token contract address", { exact: true }).textContent())!.trim();
  await page.getByRole("button", { name: "Copy token contract address" }).click();
  await expect(page.getByRole("button", { name: "Copy token contract address" })).toHaveText("Copied ✓");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(address);
});

test("wrong network shows a plain message and can switch", async ({ page }) => {
  await injectWallet(page, { account: TEAM, chainId: 1 });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByText("Wrong network. Switch to Base Sepolia.").first()).toBeVisible();
  await page.getByRole("button", { name: "Switch to Base Sepolia" }).click();
  await expect(page.getByRole("button", { name: "Switch to Base Sepolia" })).toBeHidden();
});

test("before the cliff the team cannot claim", async ({ page }) => {
  await injectWallet(page, { account: TEAM });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByText("800,000,000")).toBeVisible(); // deployer kept 80%
  await expect(page.getByText("Before cliff")).toBeVisible();
  await expect(page.getByText(/Nothing unlocks until/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Claim unlocked tokens" })).toBeDisabled();
});

test("a wallet that is not the beneficiary is told it can't claim", async ({ page }) => {
  await injectWallet(page, { account: STRANGER });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByText(/not the team wallet/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Claim unlocked tokens" })).toBeDisabled();
});

test("after the cliff the team claims, and a cancelled claim shows a plain message", async ({ page }) => {
  await rpc("evm_increaseTime", [3 * 24 * 3600]);
  await rpc("evm_mine");

  await injectWallet(page, { account: TEAM });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByText("Unlocking")).toBeVisible();
  const claim = page.getByRole("button", { name: "Claim unlocked tokens" });
  await expect(claim).toBeEnabled();

  await page.evaluate(() => ((window as unknown as { __rejectNext: boolean }).__rejectNext = true));
  await claim.click();
  await expect(page.getByText("You cancelled the request in your wallet. Nothing was sent.")).toBeVisible();

  await claim.click();
  await expect(page.getByText("Claimed. Tokens are in your wallet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "View transaction ↗" })).toHaveAttribute(
    "href",
    /sepolia\.basescan\.org\/tx\/0x[0-9a-f]{64}/,
  );
  // ~3/30 of 200M unlocked and claimed, so the balance is above the 800M start
  await expect(page.getByText(/^8[0-2]\d,\d{3},\d{3}/)).toBeVisible();
});

test("screenshots for the README", async ({ page }, info) => {
  await rpc("evm_increaseTime", [9 * 24 * 3600]);
  await rpc("evm_mine");
  await injectWallet(page, { account: TEAM });
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByText("Unlocking")).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `../docs/screenshot-${info.project.name}.png`, fullPage: true });
});
