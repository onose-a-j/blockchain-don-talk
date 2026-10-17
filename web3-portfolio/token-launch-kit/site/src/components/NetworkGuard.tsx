"use client";

import { useConnection, useSwitchChain } from "wagmi";
import { friendlyError } from "@/lib/errors";
import { CHAIN } from "@/lib/wagmi";

/** Shown only when a wallet is connected to some other network. */
export function NetworkGuard() {
  const { isConnected, chainId } = useConnection();
  const { switchChain, isPending, error } = useSwitchChain();
  if (!isConnected || chainId === CHAIN.id) return null;
  return (
    <div className="notice" role="alert">
      <p>
        <strong>Wrong network. Switch to Base Sepolia.</strong> This demo only runs on the Base Sepolia testnet.
      </p>
      <button className="btn" disabled={isPending} onClick={() => switchChain({ chainId: CHAIN.id })}>
        {isPending ? "Confirm in wallet…" : "Switch to Base Sepolia"}
      </button>
      {error && <p className="error small">{friendlyError(error)}</p>}
    </div>
  );
}
