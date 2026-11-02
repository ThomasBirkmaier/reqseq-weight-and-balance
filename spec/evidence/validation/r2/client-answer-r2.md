# Client answer: validation of release 2 (run 2)

Answered by: Client (flight school operator), 2026-11-02. Basis: the 22 walkthrough screenshots in handoff/run2/screens-r2/, judged against the Needs as confirmed in my answer handoff/run2/client-answer-needs-r2.md (release 2 draft of 2026-11-02, with my two changes) and my five conditions there. There was no separate validation note, so I judged each Need against its criteria myself.

## Decision

**Release 2 is validated for its purpose: trial and acceptance with invented aircraft, not flight operations.** All 11 Needs in this release are validated as far as screenshots can show them. N-7bfc52 (record) is not part of this release. Every criterion that needs real operation stays open for the field validation (list at the end). I have three remarks that do not block, and one question for the field validation.

I checked the numbers myself on the HC4-01 calculation table: 765 × 2.220 + 160 × 2.000 + 20 × 3.950 + 72 × 2.350 = 2266.5 kg·m, divided by 1017 kg gives 2.229 m. At landing with 40 L (29 kg) left, 2165.0 kg·m divided by 974 kg gives 2.223 m. Both match the screen.

## My conditions from the Needs answer

| # | Condition | Result |
|---|---|---|
| 1 | Fuel in litres; take-off and landing told apart | **Met.** "Usable fuel at take-off (max 170 L)", "Enter whole litres". The result has two columns, TAKE-OFF and LANDING, and the landing figure says "Landing 974 kg at 2.223 m". |
| 2 | Fuel burn above fuel, fuel above capacity, no fuel figure give "check not complete" | **Met.** Burn 101 L with 100 L on board, 171 L in a 170 L tank, and an empty fuel field each give "Check not complete" for take-off and landing (N-1e786e-1, N-6010df-2, N-1e786e-2). |
| 3 | "Invented aircraft. Not for flight operations." stays | **Met.** It is at the top of every full-page screenshot. |
| 4 | No result says "without fuel" | **Met.** No result in any screenshot says "without fuel". |
| 5 | Validation with screenshots of the named cases | **Met, with one small gap.** Reported fuel with time, pilot's own figure, landing outside after take-off within (HC-4 and HC-2) and offline use are all shown. The offline screenshot still shows the stored fuel report, so the case "no report reachable at all" is shown only indirectly: the pilot's figure works offline. I accept this. |

## Per Need

### N-1e786e Never a wrong "within limits" (release 2 draft) — VALIDATED

There are three fuel cases (burn above fuel, fuel above capacity, no fuel figure), and the release 1 cases still apply. Each fuel case shows "Check not complete: fill in or correct the marked entries" for take-off and for landing, and the faulty field is marked red. No result shows "within limits" in any of them.

### N-a02a77 Know before take-off whether the landing is within limits (release 2 draft, with my change) — VALIDATED

- **Within both:** HC4-01 is within limits at take-off and at landing (974 kg at 2.223 m).
- **Within at take-off, outside at landing:** HC4-01 is within at take-off (1101 kg at 2.469 m) and outside at landing ("centre of gravity outside envelope", 1072 kg at 2.472 m). HC2-01 is within at take-off (772 kg at 2.170 m) and outside at landing (765 kg at 2.171 m). I can name both results from the screen without calculating.
- **Landing exactly on a limit:** only shown with no fuel burn (N-790a55-2: landing 1085 kg at 2.470 m, within). A case with a real burn ending on the limit was not shown, and the HC-2 "within both" case was not shown either. I accept this because the limit rule is the same as at take-off, but these cases go into the field validation.
- **My change:** the TAKE-OFF and LANDING labels can't be confused. Met.

Criterion 2 (instructor against the paper loading sheet) is open because it needs real operation.

### N-790a55 Know at once whether the centre of gravity is permitted (release 2 draft) — VALIDATED

On HC4-01, 2.475 m is outside ("centre of gravity outside envelope") and 2.470 m, exactly on the aft limit, is within. This matches the envelope corner table (aft limit 2.470 m, boundary included). The result panel sits under the last entries without scrolling or a button. The cases for the other aircraft rest on the release 1 validation. The calculation did not change apart from the fuel line, which I checked above. Criterion 2 (instructor) is open.

### N-2c5472 Cross-check the calculation (release 2 draft) — VALIDATED

The table now has a fuel line at take-off ("Usable fuel 100 L", 72 kg, 2.350 m, 169.2 kg·m), a "Total at take-off" line, a fuel line at landing (40 L) and a "Total at landing" line. The rounding is stated on screen: masses to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m. I reproduced both totals (see above). Criterion 1 with a real instructor is open.

### N-cac39d See and correct the reported fuel quantity (release 2 draft) — VALIDATED

- The reported figure and its time are shown: "Reported by the fuel system module: 142 L at 2026-11-02 05:40 UTC".
- The pilot's figure replaces it. With 100 L entered, the app says "Pilot's figure (fuel system module reported 142 L)" and the calculation uses 100 L (72 kg).
- The pilot can tell at once which figure is used, because of the coloured "Pilot's figure" line.

### N-e01992 Use it at the aircraft on a phone (release 2 draft) — VALIDATED (screenshot part)

The light and dark screenshots are clear and high in contrast, including the two-column result. All screenshots are 360 px wide with no horizontal scrolling. Criterion 1 (readable in daylight and in a dim hangar, on our own phone) is open.

### N-e9c5c6 Know at once whether the mass is permitted (release 2 draft) — VALIDATED

- **Exactly at the maximum:** 1150 kg is within limits.
- **Above the maximum:** 1167 kg gives "Outside limits: total mass above maximum take-off mass", together with the centre of gravity message.
- **Below the maximum:** shown in the other cases.
- The result is visible without scrolling.

**Question for the field validation:** the landing result also checks against the *maximum take-off* mass. If the flight manual of our real aircraft has a separate maximum landing mass, the landing check has to use it.

### N-98a54d See where the load acts (release 2 draft) — VALIDATED

The top view shows the fuel tank with "Usable fuel 100 L" next to the seats and the baggage. The envelope shows the take-off point (circle) and the landing point (square), and I can see the centre of gravity move as fuel burns. That was my wish, and it is met. The release 2 set has no outside-limits chart; the cross for "outside" is in the legend, and the outside picture was validated in release 1. Seeing which limit is exceeded is also covered by the result text.

### N-e67c17 Right data for the individual aircraft (release 2 draft) — VALIDATED (screenshot part)

- **Aircraft shown clearly:** the selected aircraft is shown with identifier and type ("HC4-01 · Halcyra HC-4", "HC2-01 · Halcyra HC-2").
- **Data per aircraft:** each shows its own empty mass, lever arm and weighing date. With no load, HC4-01 shows 765 kg at 2.220 m and HC4-02 shows 778 kg at 2.236 m, so each aircraft has its own data.
- **Data date:** the offline notice now shows the date of the aircraft data ("aircraft data as of 2026-11-02"). That was my wish from release 1, and it is met.
- **Fuel data:** the tank capacities (170 L and 104 L) and the fuel arm 2.350 m are shown.

Criteria 1 and 3 (maintenance organisation, real re-weighing) are open.

### N-6d2299 Use it without network or installation (release 2 draft) — VALIDATED (screenshot part)

Offline, the app shows a clear notice and completes the check with the pilot's fuel figure, within at take-off and at landing. There is no account and nothing to install. Criterion 2 (flight mode on our own phone) is open.

### N-6010df Enter what is on board (release 2 draft, with my change) — VALIDATED (screenshot part)

- **Every load place for both types:** HC-4 has front seats, rear seats, baggage and fuel. HC-2 has front seats, baggage and fuel.
- **Fuel unit:** litres, as I asked.
- **Too much:** baggage at 60 kg gives "Enter 0 to 50 kg" and fuel at 171 L gives "Enter 0 to 170 L", each with a red frame.

Criterion 1 (under one minute at the aircraft) is open.

### N-7bfc52 Record of the check (draft, could)

This is not in release 2, as agreed, so I did not validate it.

## Remarks (not blocking)

1. **The fuel burn field is covered.** In several screenshots, the result panel covers the "Planned fuel burn" entry, so I could not see which burn the landing result used. I could only find it in the calculation table ("Usable fuel at landing 40 L"). Please show the planned burn in the landing result, or keep the field visible. A student must be able to see what the landing result is based on.
2. **The result panel overlaps entries.** On the full-page screenshots, the result panel sits over some entries (for example rear seats and baggage). I assume this happens because the panel stays on screen while scrolling, so it is not a problem on the phone. The field validation should confirm that no entry stays hidden.
3. **The report time is in UTC.** That is fine for aviation, but our students should be told in the briefing.

## Open: needs real operation (field validation before any real use)

These criteria cannot be met in this project, because the aircraft are invented and no real pilot, instructor or maintenance organisation takes part. They stay open, together with the open items from my release 1 validation (for example, the result staying visible while the on-screen keyboard is open):

- N-a02a77 criterion 2, N-790a55 criterion 2 and N-2c5472 criterion 1: an instructor checks take-off and landing results against the released loading sheet. This includes a landing exactly on a limit after a real fuel burn, and the HC-2 cases.
- N-e01992 criterion 1: readable in daylight and in a dim hangar, on our own phones, in light and dark mode.
- N-6d2299 criterion 2: flight mode on our own phone, including when the fuel module cannot be reached.
- N-6010df criterion 1: a pilot enters a training flight with fuel in under one minute at the aircraft.
- N-e67c17 criteria 1 and 3: the maintenance organisation compares limits, empty data, fuel arm and tank capacity, and a real re-weighing is in use before the next flight.
- N-e9c5c6: whether a separate maximum landing mass applies (see the question above).

Until these are done with real aircraft data, the app stays "Not for flight operations".
