"use client";

import { useState } from "react";
import { explorerAddress } from "@/lib/deployment";

export function CopyAddress({ address, label }: { address: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="address-row">
      <code className="mono address" aria-label={`${label} address`}>{address}</code>
      <div className="address-actions">
        <button className="btn btn-small btn-ghost" onClick={copy} aria-label={`Copy ${label} address`}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <a className="btn btn-small btn-ghost" href={explorerAddress(address)} target="_blank" rel="noreferrer">
          Basescan ↗
        </a>
      </div>
      <span className="sr-only" aria-live="polite">{copied ? "Address copied" : ""}</span>
    </div>
  );
}
