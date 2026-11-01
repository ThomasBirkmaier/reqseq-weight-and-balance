# IV&V verification of the core system requirements in the HC-2 variant (VAR-f23826)

- Item: HC-2 build (`dist/hc2/` from `sh scripts/build.sh`) at commit 2836d3f; for SR-663a61 AK2 a second build at the same commit with HC2-01 empty mass changed to 643 kg in `data/fleet.csv`.
- Method: test, by IV&V with its own script `ivv-hc2.cjs` (Playwright, Chromium, 360 × 740 px, mobile, touch), independent of the e2e suite of Req&Dev.
- Each acceptance criterion of a core SR, written for HC4-01, was carried over to HC2-01 with expected values computed by IV&V from D-91084e and `data/fleet.csv` before the run.
- HC-2 has no integer loading exactly on the sloped forward limit, so SR-687e88 AK3 uses the nearest loading inside (211/0 kg) next to the first loading outside (212/0 kg).
- Run: `node ivv-hc2.cjs <dist> scripts/serve.mjs <out> <dist with 643 kg>`, 2026-11-01. Result: all 49 checks pass.

Invented aircraft. Not for flight operations.

| SR | AK | HC-2 case (IV&V expected value) | Result | Seen |
|---|---|---|---|---|
| SR-1329af | 1 | first text of the page | pass | Invented aircraft. Not for flight operations. |
| SR-1329af | 2 | aid statement above the first result | pass | This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual. |
| SR-1329af | 3 | fuel note directly below the indication (160/20) | pass | Fuel is not included in this version. |
| SR-348143 | 1 | 160/20 → 820 kg | pass | 820 kg |
| SR-29562e | 1 | 160/20 → 2.139 m (1754.0/820) | pass | 2.139 m |
| SR-3a4905 | 1 | 160/20 (820 kg, 2.139 m) within | pass | Within limits (without fuel) |
| SR-0b76d9 | 1 | table rows 160/20 | pass | Empty mass 640 kg 2.150 m 1376.0 kg·m ; Front seats 160 kg 2.000 m 320.0 kg·m ; Baggage compartment 20 kg 2.900 m 58.0 kg·m ; Total 820 kg 2.139 m 1754.0 kg·m |
| SR-0b76d9 | 2 | rounding stated below the table | pass | Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m |
| SR-5e3579 | 1 | marks front to back: Front seats 160 kg, Baggage compartment 20 kg | pass | Front seats 160 kg@131 ; Baggage compartment 20 kg@266 |
| SR-5e3579 | 2 | baggage changed to 40 → mark 40 kg | pass | Baggage compartment 40 kg |
| SR-3f6229 | 1 | corners and point (820 kg, 2.139 m) inside | pass | {"mass":"820","cg":"2139","state":"inside","inFill":true,"label":"","corners":"550:2050 750:2050 880:2130 880:2170 550:2170"} |
| SR-3f6229 | 4 | corner table | pass | 1 550 kg 2.050 m ; 2 750 kg 2.050 m ; 3 880 kg 2.130 m ; 4 880 kg 2.170 m ; 5 550 kg 2.170 m |
| SR-3f6229 | 2 | 60/40 point (740 kg, 2.178 m) aft, label | pass | {"mass":"740","cg":"2178","state":"outside","inFill":false,"label":"Aft limit exceeded","corners":"550:2050 750:2050 880:2130 880:2170 550:2170"} |
| SR-29562e | 2 | 60/40 → 2.178 m (1612.0/740) | pass | 2.178 m |
| SR-687e88 | 1 | 60/40 (740 kg, 2.178 m, aft 2.170 m) CG outside | pass | Outside limits: centre of gravity outside envelope |
| SR-3f6229 | 3 | 212/0 point (852 kg, 2.113 m) forward of 2.11277 m, label | pass | {"mass":"852","cg":"2113","state":"outside","inFill":false,"label":"Forward limit exceeded","corners":"550:2050 750:2050 880:2130 880:2170 550:2170"} |
| SR-687e88 | 2 | 212/0 (852 kg, 1800.0/852 = 2.11268 m < forward 2.11277 m) CG outside | pass | Outside limits: centre of gravity outside envelope |
| SR-687e88 | 3 | 211/0 (851 kg, 2.11281 m, forward 2.11215 m; no exact integer forward edge exists in HC-2) not CG outside | pass | Within limits (without fuel) |
| SR-3a4905 | 3 | 75/35 (750 kg, exactly 2.170 m aft limit) within | pass | Within limits (without fuel) 2.170 m |
| SR-3a4905 | 2 | 200/40 (exactly 880 kg MTOM) within | pass | Within limits (without fuel) 880 kg |
| SR-45198e | 2 | 200/40 (880 kg) not mass outside | pass | Within limits (without fuel) |
| SR-45198e | 1 | 201/40 (881 kg) mass outside | pass | Outside limits: total mass above maximum take-off mass |
| SR-3f6229 | (extra) | 201/40 label Mass limit exceeded | pass | Mass limit exceeded |
| SR-348143 | 2 | 0/0 → 640 kg | pass | 640 kg |
| SR-e95f42 | 1 | empty entries Front seats (max 220 kg), Baggage compartment (max 40 kg) | pass | Front seats (max 220 kg) / Baggage compartment (max 40 kg) |
| SR-e95f42 | 2 | 160/0 → field 160, total 800 kg | pass | 800 kg |
| SR-181ae8 | 1 | 221 front → Enter 0 to 220 kg | pass | Enter 0 to 220 kg |
| SR-181ae8 | 2 | -5 front → Enter 0 to 220 kg | pass | Enter 0 to 220 kg |
| SR-181ae8 | 3 | 7.5 baggage → Enter 0 to 40 kg | pass | Enter 0 to 40 kg |
| SR-b59c9a | 1 | 221/0 → check not complete, no within | pass | Check not complete: fill in or correct the marked entries |
| SR-b59c9a | 3 | front changed to 220 → another indication | pass | Outside limits: centre of gravity outside envelope |
| SR-b59c9a | 2 | 160/empty → check not complete, no within | pass | Check not complete: fill in or correct the marked entries |
| SR-588924 | 1 | 160→170 front → 830 kg within 100 ms, no button | pass | 830 kg in 1.4 ms |
| SR-663a61 | 1 | Empty mass 640 kg at 2.150 m, weighed 2025-11-20 | pass | Empty mass 640 kg at 2.150 m, weighed 2025-11-20 |
| SR-663a61 | 2 | build with HC2-01 empty mass 643 kg → 0/0 shows 643 kg | pass | 643 kg |
| SR-54e043 | 1 | page width at most 360 px | pass | 360 |
| SR-54e043 | 2 | 160/0: total and indication without horizontal scrolling | pass | 360 |
| SR-54e043 | 3 | after the baggage entry the indication is inside the viewport | pass | true |
| SR-54e043 | 4 | 160/41: baggage entry and "Enter 0 to 40 kg" not covered | pass | Enter 0 to 40 kg |
| SR-070ac3 | 1 | light: indication and body text ≥ 4.5:1 | pass | indication 6.89, body 8.13 |
| SR-070ac3 | 3 | light: envelope, point, marks ≥ 3:1 | pass | envelope 7.87, point 12.36, mark 16.52 |
| SR-070ac3 | 2 | dark: indication and body text ≥ 4.5:1 | pass | indication 9.31, body 8.19 |
| SR-070ac3 | 3 | dark: envelope, point, marks ≥ 3:1 | pass | envelope 10.49, point 8.98, mark 13.41 |
| SR-384eab | 1 | opened once, offline reload, 160/0 → 800 kg | pass | 800 kg |
| SR-384eab | 4 | offline notice shown | pass | true |
| SR-384eab | 4b | notice hidden when the network is back | pass | false |
| SR-384eab | 3 | fresh browser: selection shown, no sign-in or install step | pass | true |
| SR-384eab | 2 | no network request while entering a loading | pass | none |
