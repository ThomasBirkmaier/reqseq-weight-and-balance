#!/bin/sh
# Evidence gate: every approved system requirement has a passed test result at its current
# version, in the core view and in each variant view (D-b70292). Reads the evidence under
# spec/evidence, including the enriched JUnit files of this CI run.
# Usage: evidence-gate.sh <view>...   (for example: core VAR-f23826)
set -eu
fail=0
for view in "$@"; do
  input=$(printf '{"selection":{"view":"%s","where":{"all":[{"type":["system-requirement"]},{"status":["approved"]}]}}}' "$view")
  out=$(reqseq evidence degree --input "$input" --json --workspace spec)
  echo "$out" | python3 -c '
import json, sys
view = sys.argv[1]
d = json.load(sys.stdin)["degree"]
total, share = d["total"], d.get("share")
print(f"{view}: {total} approved system requirements, share verified {share}, counts {d['"'"'counts'"'"']}")
sys.exit(0 if total == 0 or share == 1 else 1)
' "$view" || fail=1
done
if [ "$fail" -ne 0 ]; then
  echo "Evidence gate failed: an approved system requirement lacks a passed test result at its current version."
  echo "List them with: reqseq evidence without-passed-test --view <view> --workspace spec"
fi
exit "$fail"
