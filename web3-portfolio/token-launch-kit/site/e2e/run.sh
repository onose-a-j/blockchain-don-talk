#!/usr/bin/env bash
# End-to-end: local anvil (chain id 84532) -> real deploy script -> static build -> Playwright.
set -euo pipefail
SITE="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS="$SITE/../contracts"
PORT=8545
KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # anvil dev key #0

anvil --chain-id 84532 --port $PORT --silent &
ANVIL=$!
trap 'kill $ANVIL 2>/dev/null || true' EXIT
sleep 2

# wagmi batches reads through Multicall3, which exists on Base Sepolia but not on a fresh anvil.
# Copy its exact bytecode from Base Sepolia to the same address.
MULTICALL3=0xcA11bde05977b3631167028862bE2a173976CA11
CODE=$(cast code $MULTICALL3 --rpc-url https://sepolia.base.org)
cast rpc anvil_setCode $MULTICALL3 "$CODE" --rpc-url http://127.0.0.1:$PORT >/dev/null

OUT=$(cd "$CONTRACTS" && PRIVATE_KEY=$KEY CLIFF_SECONDS=86400 forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:$PORT --broadcast 2>&1)
TOKEN=$(echo "$OUT" | awk '/LaunchToken:/ {print $2; exit}')
VESTING=$(echo "$OUT" | awk '/TokenVesting:/ {print $2; exit}')
rm -rf "$CONTRACTS/broadcast/Deploy.s.sol/84532" "$CONTRACTS/cache/Deploy.s.sol/84532"
echo "token=$TOKEN vesting=$VESTING"

cd "$SITE"
NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_RPC_URL=http://127.0.0.1:$PORT \
  NEXT_PUBLIC_TOKEN_ADDRESS=$TOKEN NEXT_PUBLIC_VESTING_ADDRESS=$VESTING npx next build >/dev/null
npx playwright test "$@"
