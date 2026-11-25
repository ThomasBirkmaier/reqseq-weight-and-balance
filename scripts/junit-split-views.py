#!/usr/bin/env python3
"""Split one JUnit file of the calculation core into one file per view.

The Rust tests run once, for both aircraft types, but ReqSeq counts a test record only in a
view where its requirement applies, and `reqseq evidence enrich-junit` fails on a test case
whose requirement does not apply in the view it enriches for. This writes:

- <out-core.xml>: every test case except those of requirements the variant adds or uses as
  a replacement (they do not apply in the core);
- <out-variant.xml>: every test case except those of core requirements the variant replaces
  or excludes (they do not apply in the variant).

Which requirements these are comes from `reqseq variant diff <variant> --json`, so the split
follows the specification and has no list of its own. Dropped test cases are printed.
Usage: junit-split-views.py <in.xml> <variant> <out-core.xml> <out-variant.xml>
"""
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

REF = re.compile(r"\[([A-Z]+-[0-9a-f]{6})(?:/AK-[0-9a-z]+)?\]")


def short_ids(diff: dict, uuids: set) -> set:
    return {n["shortId"] for n in diff["names"] if n["id"] in uuids}


def write_without(src: str, dst: str, drop: set, label: str) -> None:
    tree = ET.parse(src)
    for suite in tree.iter("testsuite"):
        for case in list(suite.findall("testcase")):
            m = REF.search(case.get("name", ""))
            if m and m.group(1) in drop:
                suite.remove(case)
                print(f"{label}: dropped {case.get('name')}")
        cases = suite.findall("testcase")
        suite.set("tests", str(len(cases)))
        suite.set("failures", str(sum(1 for c in cases if c.find("failure") is not None)))
        suite.set("errors", str(sum(1 for c in cases if c.find("error") is not None)))
        suite.set("skipped", str(sum(1 for c in cases if c.find("skipped") is not None)))
    root = tree.getroot()
    if root.tag == "testsuites":
        for attr in ("tests", "failures", "errors", "skipped"):
            root.set(attr, str(sum(int(s.get(attr, "0")) for s in root.iter("testsuite"))))
    tree.write(dst, encoding="utf-8", xml_declaration=True)


def main(src: str, variant: str, out_core: str, out_variant: str) -> None:
    out = subprocess.run(
        ["reqseq", "variant", "diff", variant, "--json", "--workspace", "spec"],
        check=True, capture_output=True, text=True,
    ).stdout
    diff = json.loads(out)
    if diff.get("incomplete"):
        sys.exit(f"variant diff of {variant} is incomplete; refusing to split")
    only_variant = {r["replacement"] for r in diff["replaced"]} | {a["id"] if isinstance(a, dict) else a for a in diff["added"]}
    not_in_variant = {r["core"] for r in diff["replaced"]} | {e["id"] if isinstance(e, dict) else e for e in diff["excluded"]}
    write_without(src, out_core, short_ids(diff, only_variant), "core")
    write_without(src, out_variant, short_ids(diff, not_in_variant), variant)


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    main(*sys.argv[1:])
