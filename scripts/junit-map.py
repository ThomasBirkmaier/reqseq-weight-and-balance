#!/usr/bin/env python3
"""Map Rust test names to the bracket form ReqSeq recognises.

Rust function names cannot contain brackets, so tests are named
`sr_<short id>_ak<n>_<words>`. This rewrites each matching JUnit test case name to
`[SR-<short id>/AK<n>] <words>`; other test cases stay unchanged.
Usage: junit-map.py <in.xml> <out.xml>
"""
import re
import sys
import xml.etree.ElementTree as ET

PATTERN = re.compile(r"^(?:.*::)?sr_([0-9a-f]{6})_ak(\d+)_(.+)$")

def main(src: str, dst: str) -> None:
    tree = ET.parse(src)
    mapped = 0
    for case in tree.iter("testcase"):
        m = PATTERN.match(case.get("name", ""))
        if m:
            case.set("name", f"[SR-{m.group(1)}/AK{m.group(2)}] {m.group(3).replace('_', ' ')}")
            mapped += 1
    tree.write(dst, encoding="utf-8", xml_declaration=True)
    print(f"mapped {mapped} test cases")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
