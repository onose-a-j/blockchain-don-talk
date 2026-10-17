"use client";

import { useConnection, useReadContract } from "wagmi";
import { tokenAbi } from "@/lib/abis";
import { TOKEN_ADDRESS } from "@/lib/deployment";
import { formatTokenAmount } from "@/lib/format";
import { CHAIN } from "@/lib/wagmi";

export function WalletPanel() {
  const { address, isConnected } = useConnection();
  const { data: balance, isLoading } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN.id,
    query: { enabled: !!TOKEN_ADDRESS && !!address, refetchInterval: 15_000 },
  });
  const { data: symbol } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "symbol",
    chainId: CHAIN.id,
    query: { enabled: !!TOKEN_ADDRESS },
  });

  return (
    <section className="card" aria-labelledby="wallet-title">
      <h2 id="wallet-title">Your wallet</h2>
      {!isConnected ? (
        <p className="muted">Connect a wallet to see your balance.</p>
      ) : !TOKEN_ADDRESS ? (
        <p className="muted">Balance shows once the token is deployed.</p>
      ) : (
        <dl className="stats">
          <div className="wide">
            <dt>Balance</dt>
            <dd className="big">
              {isLoading || balance === undefined ? "…" : formatTokenAmount(balance)} <span className="unit">{symbol}</span>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
