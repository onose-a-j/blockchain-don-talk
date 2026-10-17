import { formatUnits } from "viem";

/** 1234567.891 tokens -> "1,234,567.89". Works on the full bigint, no float precision loss. */
export function formatTokenAmount(value: bigint, decimals = 18, maxFraction = 2): string {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = fraction.slice(0, maxFraction).replace(/0+$/, "");
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDate(unixSeconds: bigint | number): string {
  return new Date(Number(unixSeconds) * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Share of `part` in `total` as a 0–100 number with one decimal, safe for total = 0. */
export function percent(part: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number((part * 1000n) / total) / 10;
}
