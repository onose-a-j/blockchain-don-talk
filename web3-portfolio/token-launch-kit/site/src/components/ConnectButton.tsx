"use client";

import { useEffect, useState } from "react";
import { useConnect, useConnection, useDisconnect } from "wagmi";
import { friendlyError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, isConnected } = useConnection();
  const { connect, connectors, isPending, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [noWallet, setNoWallet] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <button className="btn" disabled>Connect wallet</button>;

  if (isConnected && address) {
    return (
      <div className="connect">
        <span className="pill mono" title={address}>{shortAddress(address)}</span>
        <button className="btn btn-ghost" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  const connector = connectors[0];
  return (
    <div className="connect">
      <button
        className="btn"
        disabled={isPending}
        onClick={() => {
          reset();
          if (typeof window !== "undefined" && !("ethereum" in window)) {
            setNoWallet(true);
            return;
          }
          connect({ connector });
        }}
      >
        {isPending ? "Check your wallet…" : "Connect wallet"}
      </button>
      {(error || noWallet) && (
        <p className="error small" role="alert">
          {noWallet ? friendlyError("no injected wallet") : friendlyError(error)}
        </p>
      )}
    </div>
  );
}
