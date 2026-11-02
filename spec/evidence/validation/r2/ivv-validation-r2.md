# IV&V validation of release 2 (run 2)

Validation of the eleven needs of release 2 by IV&V, 2026-11-02, at build fb308e5 (implementation PR #24). Basis:

- the 22 walk-through screenshots in this folder (phone viewport 360 px, from `e2e/walkthrough/release-2.spec.ts`);
- the client's answer `client-answer-r2.md` (the flight school operator judged every need against its criteria from the screenshots and reproduced the HC4-01 take-off and landing totals);
- the client confirmation of the needs of release 2, D-1a5845, and its five conditions;
- IV&V's own check of three screenshots: the take-off and landing totals of `N-2c5472-1` (2266.5 kg·m / 1017 kg = 2.229 m; 2165.0 kg·m / 974 kg = 2.223 m) and the case of `N-a02a77-landing-outside` (1101 kg at 2.469 m within; landing 1072 kg at 2.472 m, aft of the aft limit 2.470 m).

The method for the criteria that only a real pilot, instructor or maintenance organisation at a real aircraft can meet is the one of D-a61e10, applied by the client to release 2: they are validated from the screenshots and the automated tests, and **a field validation at the aircraft stays open and must be done before any real use**. Release 2 is validated for trial and acceptance with invented aircraft, not for flight operations.

N-7bfc52 (record of the check, could) is not part of release 2 and is not validated.

| Need | Result | Criteria and evidence | Open in the field validation |
|---|---|---|---|
| N-1e786e Never a wrong "within limits" | passed | burn above fuel, fuel above capacity and no fuel figure each give "Check not complete" at take-off and landing with the field marked: `N-1e786e-*.png`, `N-6010df-2-too-much.png`; the release 1 cases still apply | – |
| N-a02a77 Landing within limits before take-off | passed | within both (HC4-01), within at take-off and outside at landing for HC-4 and HC-2, TAKE-OFF and LANDING told apart: `N-a02a77-*.png` | criterion 2 (instructor against the loading sheet), including a landing exactly on a limit after a real burn and the HC-2 "within both" case |
| N-790a55 CG at once | passed | 2.475 m outside, 2.470 m on the aft limit within, result under the last entries without scrolling: `N-790a55-*.png` | criterion 2 (instructor) |
| N-2c5472 Cross-check | passed | fuel lines and totals at take-off and landing, rounding stated; both totals reproduced by the client and IV&V: `N-2c5472-1-*.png` | criterion 1 (real instructor) |
| N-cac39d Reported fuel quantity | passed | reported figure with time, pilot's figure replaces it and is marked: `N-cac39d-*.png` | – |
| N-e01992 Phone | passed | light and dark result readable at 360 px, no horizontal scrolling: `N-e01992-*.png` | criterion 1 (daylight and dim hangar, own phone) |
| N-e9c5c6 Mass at once | passed | exactly at MTOM within, above MTOM outside with both messages: `N-e9c5c6-*.png` | whether a real aircraft has a separate maximum landing mass (the invented type data name none, D-1a5845) |
| N-98a54d See where the load acts | passed | fuel tank in the top view, take-off and landing points in the envelope: `N-98a54d-*.png`; the outside picture rests on release 1 | – |
| N-e67c17 Right data | passed | aircraft and type, empty mass, lever arm, weighing date per aircraft, data date in the offline notice, tank capacities and fuel arm: `N-e67c17-*.png`, `N-6d2299-1-*.png` | criteria 1 and 3 (maintenance organisation, real re-weighing) |
| N-6d2299 No network or installation | passed | offline notice, check completed with the pilot's figure, no account or install: `N-6d2299-1-*.png` | criterion 2 (flight mode on own phone, fuel module unreachable) |
| N-6010df Enter what is on board | passed | every load place of both types, fuel in litres, too much marked: `N-6010df-*.png` | criterion 1 (under one minute at the aircraft) |

The open items of the release 1 validation also stay open (for example the result visible with the on-screen keyboard open).

## Client remarks (not blocking, for the next release)

1. The result panel can cover the planned fuel burn entry; the landing result should show the burn it is based on, or the field should stay visible.
2. On full-page screenshots the result panel overlaps entries; the field validation confirms that no entry stays hidden on the phone.
3. The report time is shown in UTC; students are told so in the briefing.

Invented aircraft. Not for flight operations.
