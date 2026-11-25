#!/bin/sh
# File length gate for the Rust core (ESLint's max-lines covers TypeScript and JavaScript):
# a source file has at most 300 lines, a test file at most 400. Split a file before it grows past.
set -eu
fail=0
check() {
  limit=$1
  shift
  for f in "$@"; do
    n=$(wc -l < "${f}")
    if [ "${n}" -gt "${limit}" ]; then
      echo "${f}: ${n} lines, more than ${limit}; split it into modules"
      fail=1
    fi
  done
}
check 300 core/src/*.rs
check 400 core/tests/*.rs
exit "${fail}"
