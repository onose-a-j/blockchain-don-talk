import { describe, expect, it } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it("maps wallet rejection", () => {
    expect(friendlyError({ name: "UserRejectedRequestError", message: "User rejected the request." })).toMatch(/cancelled/);
  });
  it("maps custom contract errors found deep in the cause chain", () => {
    const err = { shortMessage: "execution reverted", cause: { cause: { data: { errorName: "NothingToClaim" } } } };
    expect(friendlyError(err)).toMatch(/Nothing to claim yet/);
    expect(friendlyError({ message: 'reverted with custom error "NotBeneficiary()"' })).toMatch(/Only the team wallet/);
  });
  it("maps chain mismatch to the plain wrong-network sentence", () => {
    expect(friendlyError(new Error("The current chain of the wallet (id: 1) does not match the target chain"))).toBe(
      "Wrong network. Switch to Base Sepolia.",
    );
  });
  it("maps gas and connectivity errors", () => {
    expect(friendlyError(new Error("insufficient funds for gas * price + value"))).toMatch(/faucet/);
    expect(friendlyError(new Error("HTTP request failed. Status: 503"))).toMatch(/Could not reach/);
  });
  it("never leaks raw RPC text", () => {
    expect(friendlyError(new Error("0xdeadbeef internal JSON-RPC error -32603"))).toBe("Something went wrong. Please try again.");
    expect(friendlyError(undefined)).toBe("Something went wrong. Please try again.");
  });
});
