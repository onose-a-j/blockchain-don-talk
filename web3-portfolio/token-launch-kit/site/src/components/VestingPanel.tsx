"use client";

import { useEffect } from "react";
import { useBlock, useConnection, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { vestingAbi } from "@/lib/abis";
import { explorerTx, VESTING_ADDRESS } from "@/lib/deployment";
import { friendlyError } from "@/lib/errors";
import { formatDate, formatTokenAmount, percent } from "@/lib/format";
import { CHAIN } from "@/lib/wagmi";
import { CopyAddress } from "./CopyAddress";

export function VestingPanel() {
  const { address, chainId, isConnected } = useConnection();
  const contract = { address: VESTING_ADDRESS, abi: vestingAbi, chainId: CHAIN.id } as const;
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "beneficiary" },
      { ...contract, functionName: "cliff" },
      { ...contract, functionName: "end" },
      { ...contract, functionName: "totalAllocation" },
      { ...contract, functionName: "released" },
      { ...contract, functionName: "claimable" },
    ],
    allowFailure: false,
    query: { enabled: !!VESTING_ADDRESS, refetchInterval: 10_000 },
  });

  // Status uses chain time, not the visitor's clock: the contract decides with block.timestamp.
  const { data: block } = useBlock({ chainId: CHAIN.id, query: { refetchInterval: 10_000 } });

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: CHAIN.id });
  useEffect(() => {
    if (receipt.isSuccess) refetch();
  }, [receipt.isSuccess, refetch]);

  if (!VESTING_ADDRESS) {
    return (
      <section className="card" aria-labelledby="vesting-title">
        <h2 id="vesting-title">Team vesting</h2>
        <p className="muted">The vesting contract appears here after the testnet deploy.</p>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="card" aria-labelledby="vesting-title">
        <h2 id="vesting-title">Team vesting</h2>
        <p className={error ? "error" : "muted"}>{error ? friendlyError(error) : "Loading vesting schedule…"}</p>
      </section>
    );
  }

  const vestingAddress = VESTING_ADDRESS;
  const [beneficiary, cliff, end, total, released, claimable] = data;
  const now = block?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));
  const vested = released + claimable;
  const isBeneficiary = !!address && address.toLowerCase() === beneficiary.toLowerCase();
  const wrongNetwork = isConnected && chainId !== CHAIN.id;
  const busy = isPending || receipt.isLoading;

  let hint = "";
  if (!isConnected) hint = "Connect the team wallet to claim.";
  else if (wrongNetwork) hint = "Wrong network. Switch to Base Sepolia.";
  else if (!isBeneficiary) hint = "This wallet is not the team wallet, so it can't claim. Anyone can watch the schedule.";
  else if (claimable === 0n) hint = now < cliff ? `Nothing unlocks until ${formatDate(cliff)}.` : "Nothing to claim right now.";

  return (
    <section className="card" aria-labelledby="vesting-title">
      <div className="card-head">
        <h2 id="vesting-title">Team vesting</h2>
        <span className={`pill ${now < cliff ? "pill-warn" : now >= end ? "pill-done" : "pill-live"}`}>
          {now < cliff ? "Before cliff" : now >= end ? "Fully vested" : "Unlocking"}
        </span>
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-label="Share of team tokens unlocked"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent(vested, total)}
      >
        <div className="progress-vested" style={{ width: `${percent(vested, total)}%` }} />
        <div className="progress-released" style={{ width: `${percent(released, total)}%` }} />
      </div>
      <p className="legend small">
        <span className="dot dot-released" /> Claimed {percent(released, total)}% · <span className="dot dot-vested" />{" "}
        Unlocked {percent(vested, total)}%
      </p>

      <dl className="stats">
        <div className="wide">
          <dt>Claimable now</dt>
          <dd className="big">{formatTokenAmount(claimable)}</dd>
        </div>
        <div>
          <dt>Already claimed</dt>
          <dd>{formatTokenAmount(released)}</dd>
        </div>
        <div>
          <dt>Total locked for team</dt>
          <dd>{formatTokenAmount(total)}</dd>
        </div>
        <div>
          <dt>Cliff</dt>
          <dd>{formatDate(cliff)}</dd>
        </div>
        <div>
          <dt>Fully vested</dt>
          <dd>{formatDate(end)}</dd>
        </div>
      </dl>

      <div className="claim">
        <button
          className="btn btn-primary"
          disabled={!isBeneficiary || wrongNetwork || claimable === 0n || busy}
          onClick={() => {
            reset();
            writeContract({ address: vestingAddress, abi: vestingAbi, functionName: "claim", chainId: CHAIN.id });
          }}
        >
          {isPending ? "Confirm in your wallet…" : receipt.isLoading ? "Claiming…" : "Claim unlocked tokens"}
        </button>
        <div aria-live="polite">
          {hint && !writeError && !hash && <p className="muted small">{hint}</p>}
          {writeError && <p className="error small">{friendlyError(writeError)}</p>}
          {receipt.isError && <p className="error small">{friendlyError(receipt.error)}</p>}
          {receipt.isSuccess && hash && (
            <p className="success small">
              Claimed. Tokens are in your wallet.{" "}
              <a href={explorerTx(hash)} target="_blank" rel="noreferrer">
                View transaction ↗
              </a>
            </p>
          )}
        </div>
      </div>

      <h3 className="sub">Vesting contract</h3>
      <CopyAddress address={VESTING_ADDRESS} label="vesting contract" />
      <p className="muted small break">Beneficiary: <code className="mono">{beneficiary}</code></p>
    </section>
  );
}
