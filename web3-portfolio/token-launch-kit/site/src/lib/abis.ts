export const tokenAbi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const vestingAbi = [
  { type: "function", name: "beneficiary", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "start", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "cliff", stateMutability: "view", inputs: [], outputs: [{ type: "uint64" }] },
  { type: "function", name: "end", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "released", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalAllocation", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claimable", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "error", name: "NotBeneficiary", inputs: [] },
  { type: "error", name: "NothingToClaim", inputs: [] },
] as const;
