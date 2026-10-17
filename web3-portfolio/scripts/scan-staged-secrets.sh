#!/usr/bin/env bash
# Pre-push check: fail if staged files contain private keys, seed phrases, .env or keypair files.
# Allows only anvil's well-known public dev keys (they never hold real funds).
set -uo pipefail
ALLOW='ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80|59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
fail=0
files=$(git diff --cached --name-only --diff-filter=ACMR)

bad_names=$(echo "$files" | grep -E '(^|/)\.env($|\.)|keypair.*\.json$|(^|/)id\.json$|\.key$|(^|/)wallet.*\.json$' | grep -v '\.env\.example$' || true)
if [ -n "$bad_names" ]; then echo "BLOCKED secret-looking files staged:"; echo "$bad_names"; fail=1; fi

for f in $files; do
  [ -f "$f" ] || continue
  case "$f" in *.png|*.jpg|*.jpeg|*.gif|*.ico|*.woff|*.woff2) continue;; esac
  # 64-hex private keys (with or without 0x) that are not allow-listed
  hits=$(git show ":$f" | grep -noE '(^|[^0-9a-fA-F])(0x)?[0-9a-fA-F]{64}([^0-9a-fA-F]|$)' | grep -viE "$ALLOW" || true)
  # skip tx hashes / bytes32 in Foundry broadcast logs and lockfile integrity hashes
  case "$f" in */broadcast/*|*package-lock.json|*.txt|*/_next/*) hits="";; esac
  if [ -n "$hits" ]; then echo "BLOCKED possible private key in $f:"; echo "$hits" | head -3; fail=1; fi
  # Solana keypair arrays: [12,34,...] with 64 numbers
  if git show ":$f" | grep -qE '\[\s*([0-9]{1,3}\s*,\s*){63}[0-9]{1,3}\s*\]'; then echo "BLOCKED Solana keypair array in $f"; fail=1; fi
  # seed phrases
  if git show ":$f" | grep -qiE '(mnemonic|seed[ _-]?phrase|secret recovery phrase)\s*[:=]\s*["'"'"']?[a-z]+( [a-z]+){11,23}'; then
    echo "BLOCKED possible seed phrase in $f"; fail=1
  fi
done
# the throwaway deployer key must never appear anywhere
if [ -f "$HOME/.testnet-wallet/key.env" ]; then
  k=$(grep PRIVATE_KEY "$HOME/.testnet-wallet/key.env" | cut -d= -f2 | sed 's/^0x//')
  if git diff --cached | grep -qi "$k"; then echo "BLOCKED testnet deployer key found in staged diff"; fail=1; fi
fi
[ $fail -eq 0 ] && echo "secret scan: clean ($(echo "$files" | grep -c . ) staged files)"
exit $fail
