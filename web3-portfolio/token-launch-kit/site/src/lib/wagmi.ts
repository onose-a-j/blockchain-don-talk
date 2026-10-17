import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const CHAIN = baseSepolia;

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  // NEXT_PUBLIC_RPC_URL lets the e2e suite point the site at a local anvil node.
  transports: { [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL || undefined) },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
