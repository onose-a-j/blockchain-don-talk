import { describe, expect, it } from "vitest";
import { formatTokenAmount, percent, shortAddress } from "./format";

describe("formatTokenAmount", () => {
  it("groups thousands and trims fractions", () => {
    expect(formatTokenAmount(1_000_000_000n * 10n ** 18n)).toBe("1,000,000,000");
    expect(formatTokenAmount(1_234_567_891n * 10n ** 15n)).toBe("1,234,567.89");
    expect(formatTokenAmount(10n ** 17n)).toBe("0.1");
    expect(formatTokenAmount(0n)).toBe("0");
  });
  it("keeps precision on values far above 2^53", () => {
    expect(formatTokenAmount(123_456_789_012_345_678_901n * 10n ** 18n)).toBe("123,456,789,012,345,678,901");
  });
});

describe("percent", () => {
  it("handles zero totals and rounds down to one decimal", () => {
    expect(percent(1n, 0n)).toBe(0);
    expect(percent(1n, 3n)).toBe(33.3);
    expect(percent(5n, 5n)).toBe(100);
  });
});

describe("shortAddress", () => {
  it("shortens", () => {
    expect(shortAddress("0x30d9059AADA547dA4c9819ea8061E4a3bbeF112F")).toBe("0x30d9…112F");
  });
});
