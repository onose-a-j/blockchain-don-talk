"use client";

import { useReadContracts } from "wagmi";
import { tokenAbi } from "@/lib/abis";
import { TOKEN_ADDRESS } from "@/lib/deployment";
import { friendlyError } from "@/lib/errors";
import { formatTokenAmount } from "@/lib/format";
import { CHAIN } from "@/lib/wagmi";
import { CopyAddress } from "./CopyAddress";

export function TokenPanel() {
  const contract = { address: TOKEN_ADDRESS, abi: tokenAbi, chainId: CHAIN.id } as const;
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      { ...contract, functionName: "name" },
      { ...contract, functionName: "symbol" },
      { ...contract, functionName: "totalSupply" },
      { ...contract, functionName: "decimals" },
    ],
    allowFailure: false,
    query: { enabled: !!TOKEN_ADDRESS },
  });

  return (
    <section className="card" aria-labelledby="token-title">
      <h2 id="token-title">Token</h2>
      {!TOKEN_ADDRESS ? (
        <p className="muted">Contracts are not deployed yet. Addresses appear here after the testnet deploy.</p>
      ) : isLoading ? (
        <p className="muted">Loading token details…</p>
      ) : error || !data ? (
        <p className="error">{friendlyError(error)}</p>
      ) : (
        <>
          <dl className="stats">
            <div>
              <dt>Name</dt>
              <dd>{data[0]}</dd>
            </div>
            <div>
              <dt>Symbol</dt>
              <dd>{data[1]}</dd>
            </div>
            <div className="wide">
              <dt>Total supply (fixed)</dt>
              <dd>
                {formatTokenAmount(data[2], data[3])} {data[1]}
              </dd>
            </div>
          </dl>
          <CopyAddress address={TOKEN_ADDRESS} label="token contract" />
        </>
      )}
    </section>
  );
}
