#!/bin/sh
# Build the calculation core to WebAssembly and the web app into dist/ (core build at the
# root, Halcyra HC-2 variant build below dist/hc2/).
set -eu
cargo build --release --target wasm32-unknown-unknown --manifest-path core/Cargo.toml
rm -rf dist
npx tsc -p tsconfig.json
VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo dev)
for v in hc4 hc2; do
  if [ "$v" = hc4 ]; then out=dist; base=./; else out=dist/hc2; base=../; fi
  mkdir -p "$out"
  sed -e "s/__TYPE__/$v/g" -e "s|__BASE__|$base|g" web/index.html > "$out/index.html"
  sed -e "s/__VERSION__/$VERSION-$v/g" web/sw.js > "$out/sw.js"
done
cp web/style.css web/manifest.webmanifest dist/
cp core/target/wasm32-unknown-unknown/release/wb_core.wasm dist/wb_core.wasm
touch dist/.nojekyll
echo "built dist/ ($VERSION)"
