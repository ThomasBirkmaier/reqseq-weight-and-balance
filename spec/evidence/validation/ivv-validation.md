# IV&V validation of release 1 (run 1)

Validation of the eight needs of release 1 by IV&V, 2026-11-01, at main 215a092. Basis: the walk-through screenshots in this folder (phone viewport 360 × 740 px), the client's answers `client-answer-round-1.md` and `client-answer-round-2.md`, IV&V's own exploratory tests (reviews of PR #7 and PR #13, and `../ivv/hc2-variant/`), and the Decision D-a61e10 (validation of person-only criteria in release 1).

Under D-a61e10 the criteria that need a real pilot, instructor or maintenance organisation at the aircraft are validated by the flight school operator from the screenshots and the automated tests. **A field validation at the aircraft stays open and must be done before any real use** (scope: client answer round 2, "Proposal for the person-only criteria").

| Need | Result | Criteria and evidence | Open in the field validation (D-a61e10) |
|---|---|---|---|
| N-1e786e Never a wrong "within limits" | passed | each entry left out and impossible values give "Check not complete", never "within limits": `N-1e786e-*.png`; IV&V tests (+5, 1e2, Arabic digit) | – |
| N-2c5472 Cross-check | passed | client reproduced HC4-01 160/0/20 (945 kg, 2.219 m) and HC4-02 100/100/10 (988 kg, 2.332 m) within the stated rounding: `N-2c5472-table-*.png`, round 1 item 5 | – |
| N-98a54d See where the load acts | passed | client fixed the aft case from the pictures (1005 kg, 2.414 m inside) and named each limit: `N-98a54d-*.png`, round 1 item 8 | – |
| N-e9c5c6 Mass at once | passed | below / at / above MTOM for every aircraft, result visible without scrolling or button: `N-e9c5c6-*.png`, round 1 item 4 | result visible with the on-screen keyboard open |
| N-790a55 CG at once | passed | inside / edge / outside for every aircraft, visible without scrolling: `N-790a55-*.png`; client checked against the corner numbers (round 2 item 4) | instructor against the released loading sheet |
| N-6010df Enter what is on board | passed | every load place of both types can be entered (`N-6010df-1-entries.png`, `-3-hc2-entries.png`, round 2 item 2); too much is marked and visible (`-2-too-much.png`, round 2 item 1, issue #12 fixed in PR #13) | pilot enters a training flight in under one minute without help |
| N-e01992 Phone | passed | no account or install (round 1 item 7); light and dark mode readable on screenshots (`N-e01992-dark-*.png`, round 2 item 3) and contrast tests SR-070ac3; offline (`N-e01992-offline*.png`, round 2 item 5) and tests SR-384eab | readability in daylight and a dim hangar; flight mode on the pilot's own phone |
| N-e67c17 Right data | passed | aircraft and type shown with empty mass, lever arm, weighing date (`N-e67c17-HC*.png`); limits as numbers (`-type-limits-*.png`, round 2 item 4); new empty mass shown at the next opening with network (`-reweigh-*.png`), without network the offline notice points to the weighing date (accepted for release 1, round 1 item 10, round 2 item 5) | maintenance organisation compares with its released data |

Release-2 items from the client (not part of this validation): show when the aircraft data was last updated (D-a61e10 point 4).

Invented aircraft. Not for flight operations.
