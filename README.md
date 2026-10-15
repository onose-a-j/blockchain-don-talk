# Blockchain Don Talk 💘

A viral, WhatsApp-first Web3 mini app for Nigeria. Enter your name and your crush's name. The "blockchain" decides how compatible you are, in Pidgin.

The joke works because it's actually true. The score is **deterministic and verifiable**: it comes from `keccak256`, the same hash function Ethereum uses. The same two names always get the same score, on any phone, forever, and anyone can check it.

## Features

- **Zero-friction play.** No wallet, no sign-up, no backend. It works inside WhatsApp's in-app browser.
- **Pidgin verdicts**, from "Una go marry for Ikoyi Registry 💍" down to "Run! 🏃🏾‍♂️💨".
- **Share for WhatsApp.** Pre-filled message plus a link that opens straight to the result.
- **Viral loop.** Friends who open a shared link see the result, then get "Your own nko? 👀".
- **Save for Status.** Generates a 1080×1920 PNG card. On mobile it opens the native share sheet so you can post it straight to WhatsApp Status.
- **On-chain proof.** Shows the exact hash input and output.
- **Optional on-chain seal.** Crypto users can seal their result with the `LoveSeal` contract on Base Sepolia. Only the hash is stored, never the names, and the contract recomputes the score itself so nobody can fake it.
- **Light on data.** About 10 KB of JS. ethers.js (~400 KB) loads only when someone taps "Seal am on-chain".

## How the score works

```
input = sort([lower(trim(nameA)), lower(trim(nameB))]).join("|")   // "amaka|tunde"
hash  = keccak256(input)
score = uint16(hash[0..2]) % 101
```

The same formula is in `contracts/LoveSeal.sol → scoreOf()`.

## Run locally

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Deploy the website (free)

1. Push this folder to a GitHub repo.
2. Turn on **GitHub Pages** (Settings → Pages → Deploy from branch), or drag the folder into **Netlify Drop** / import it on **Vercel**.
3. Make a 1200×630 `og-image.png` (a screenshot of a result card works well) and set `og:image` in `index.html` to its **absolute** URL. WhatsApp needs the absolute URL to show a rich link preview, and that preview is what makes people tap.

## Deploy the contract (optional)

1. Get free Base Sepolia test ETH from a faucet (e.g. the Coinbase Developer Platform faucet).
2. Open [Remix](https://remix.ethereum.org) and paste in `contracts/LoveSeal.sol`.
3. Compile with Solidity 0.8.20+.
4. Deploy with "Injected Provider – MetaMask" while your wallet is on Base Sepolia.
5. Copy the deployed address into `CONTRACT.address` in `app.js`.

## Tech

HTML · CSS · vanilla JS · js-sha3 (keccak256) · ethers.js v6 · Solidity · Canvas API · Web Share API

## Disclaimer

Na for cruise 😂 The score is a hash, not relationship advice.
