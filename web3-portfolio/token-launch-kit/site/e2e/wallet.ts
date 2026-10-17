import type { Page } from "@playwright/test";

export const RPC = process.env.E2E_RPC_URL ?? "http://127.0.0.1:8545";
// anvil's default dev accounts: unlocked on the local node, never hold real funds
export const TEAM = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
export const STRANGER = "0x70997970C51812dc3A010C7d01b50e0d17dC79C8";

export async function rpc(method: string, params: unknown[] = []) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

/**
 * Inject a minimal EIP-1193 wallet into the page. It answers account/chain questions itself and
 * forwards everything else (including eth_sendTransaction) to the local anvil node.
 */
export async function injectWallet(page: Page, opts: { account: string; chainId?: number }) {
  await page.addInitScript(
    ({ account, chainId, rpcUrl }) => {
      const w = window as unknown as Record<string, unknown>;
      w.__rejectNext = false;
      let id = 0;
      let currentChain = chainId;
      const listeners: Record<string, ((...a: unknown[]) => void)[]> = {};
      const emit = (event: string, arg: unknown) => (listeners[event] ?? []).forEach((fn) => fn(arg));
      w.ethereum = {
        isMetaMask: true,
        on: (e: string, fn: (...a: unknown[]) => void) => ((listeners[e] ??= []).push(fn)),
        removeListener: (e: string, fn: (...a: unknown[]) => void) => {
          listeners[e] = (listeners[e] ?? []).filter((f) => f !== fn);
        },
        async request({ method, params }: { method: string; params?: unknown[] }) {
          switch (method) {
            case "eth_requestAccounts":
            case "eth_accounts":
              return [account];
            case "eth_chainId":
              return "0x" + currentChain.toString(16);
            case "wallet_requestPermissions":
            case "wallet_getPermissions":
              return [{ parentCapability: "eth_accounts" }];
            case "wallet_revokePermissions":
              return null;
            case "wallet_switchEthereumChain": {
              currentChain = parseInt((params as { chainId: string }[])[0].chainId, 16);
              emit("chainChanged", "0x" + currentChain.toString(16));
              return null;
            }
            case "eth_sendTransaction":
              if (w.__rejectNext) {
                w.__rejectNext = false;
                throw Object.assign(new Error("User rejected the request."), { code: 4001 });
              }
          }
          const res = await fetch(rpcUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params: params ?? [] }),
          });
          const json = await res.json();
          if (json.error) throw Object.assign(new Error(json.error.message), json.error);
          return json.result;
        },
      };
    },
    { account: opts.account, chainId: opts.chainId ?? 84532, rpcUrl: RPC },
  );
}
