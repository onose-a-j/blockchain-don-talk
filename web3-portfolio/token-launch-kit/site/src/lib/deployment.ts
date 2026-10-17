import { isAddress, type Address } from "viem";
import deployment from "./deployment.json";

function pick(envValue: string | undefined, fileValue: string | null): Address | undefined {
  const value = envValue || fileValue;
  return value && isAddress(value) ? value : undefined;
}

// Addresses come from deployment.json (written after `forge script` runs),
// and can be overridden at build time with NEXT_PUBLIC_* env vars.
export const TOKEN_ADDRESS = pick(process.env.NEXT_PUBLIC_TOKEN_ADDRESS, deployment.token);
export const VESTING_ADDRESS = pick(process.env.NEXT_PUBLIC_VESTING_ADDRESS, deployment.vesting);

export const EXPLORER = "https://sepolia.basescan.org";
export const explorerAddress = (a: string) => `${EXPLORER}/address/${a}`;
export const explorerTx = (h: string) => `${EXPLORER}/tx/${h}`;
