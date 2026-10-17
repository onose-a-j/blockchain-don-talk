import { ConnectButton } from "@/components/ConnectButton";
import { NetworkGuard } from "@/components/NetworkGuard";
import { TokenPanel } from "@/components/TokenPanel";
import { VestingPanel } from "@/components/VestingPanel";
import { WalletPanel } from "@/components/WalletPanel";

export default function Home() {
  return (
    <>
      <div className="banner" role="note">
        Portfolio demo on Base Sepolia testnet. Not a real token.
      </div>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">◆</span>
          <span>Token Launch Kit</span>
        </div>
        <ConnectButton />
      </header>
      <main className="container">
        <section className="hero">
          <p className="eyebrow">ERC-20 · Linear vesting with cliff · Base Sepolia</p>
          <h1>Fixed supply. Locked team tokens. Nothing hidden.</h1>
          <p className="lede">
            The whole supply was minted once at deploy and there is no mint function. Team tokens sit in a vesting
            contract with no owner. They unlock after a cliff, then second by second until the end date.
          </p>
        </section>
        <NetworkGuard />
        <div className="grid">
          <TokenPanel />
          <WalletPanel />
        </div>
        <VestingPanel />
        <footer className="footer">
          <p>
            Built by <a href="https://japhethstudios.com">Japheth Studios</a> as a testnet portfolio project. Contracts
            were checked in a security review, not an audit. Testnet tokens have no value.
          </p>
        </footer>
      </main>
    </>
  );
}
