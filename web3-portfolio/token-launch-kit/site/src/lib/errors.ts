/**
 * Turn wallet / RPC / contract errors into one plain sentence a non-developer can act on.
 * Never shows raw RPC text.
 */
export function friendlyError(error: unknown): string {
  const text = collectText(error).toLowerCase();

  if (text.includes("user rejected") || text.includes("user denied") || text.includes("rejected the request"))
    return "You cancelled the request in your wallet. Nothing was sent.";
  if (text.includes("notbeneficiary"))
    return "Only the team wallet set in the vesting contract can claim. Connect that wallet to claim.";
  if (text.includes("nothingtoclaim"))
    return "Nothing to claim yet. Tokens unlock after the cliff date, then a little more every second.";
  if (text.includes("chain mismatch") || text.includes("does not match the target chain") || text.includes("wrong network"))
    return "Wrong network. Switch to Base Sepolia.";
  if (text.includes("insufficient funds"))
    return "Your wallet needs a little Base Sepolia ETH to pay gas. Get some free from a Base Sepolia faucet.";
  if (text.includes("connector not found") || text.includes("provider not found") || text.includes("no injected"))
    return "No browser wallet found. Install MetaMask, Coinbase Wallet or Rabby, then reload this page.";
  if (text.includes("already pending") || text.includes("request of type"))
    return "Your wallet already has a request open. Check the wallet window.";
  if (text.includes("fetch") || text.includes("network") || text.includes("timeout") || text.includes("http request failed"))
    return "Could not reach Base Sepolia. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

function collectText(error: unknown, depth = 0): string {
  if (!error || depth > 5) return "";
  if (typeof error === "string") return error;
  if (typeof error !== "object") return String(error);
  const e = error as Record<string, unknown>;
  const parts = [e.name, e.shortMessage, e.message, e.details, e.errorName]
    .concat((e.data as Record<string, unknown> | undefined)?.errorName)
    .filter((p): p is string => typeof p === "string");
  return [...parts, collectText(e.cause, depth + 1)].join(" ");
}
