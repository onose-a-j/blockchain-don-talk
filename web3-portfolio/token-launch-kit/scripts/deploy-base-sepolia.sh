#!/usr/bin/env bash
# Deploy LaunchToken + TokenVesting to Base Sepolia and write the addresses for the site.
# Reads secrets from ./.env (see .env.example). Testnet only: Deploy.s.sol refuses any other chain.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a; source "$ROOT/.env"; set +a
[ -n "${TEAM_BENEFICIARY:-}" ] || unset TEAM_BENEFICIARY

RPC="${BASE_SEPOLIA_RPC_URL:-https://sepolia.base.org}"
[ "$(cast chain-id --rpc-url "$RPC")" = "84532" ] || { echo "RPC is not Base Sepolia. Stopping."; exit 1; }

VERIFY=()
if [ -n "${ETHERSCAN_API_KEY:-}" ]; then VERIFY=(--verify --etherscan-api-key "$ETHERSCAN_API_KEY"); fi

cd "$ROOT/contracts"
forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast "${VERIFY[@]}" | tee /tmp/tlk-deploy.log
TOKEN=$(awk '/LaunchToken:/ {print $2; exit}' /tmp/tlk-deploy.log)
VESTING=$(awk '/TokenVesting:/ {print $2; exit}' /tmp/tlk-deploy.log)

cat > "$ROOT/site/src/lib/deployment.json" <<JSON
{
  "chainId": 84532,
  "token": "$TOKEN",
  "vesting": "$VESTING"
}
JSON
echo "Wrote site/src/lib/deployment.json"
echo "Token:   https://sepolia.basescan.org/address/$TOKEN"
echo "Vesting: https://sepolia.basescan.org/address/$VESTING"
