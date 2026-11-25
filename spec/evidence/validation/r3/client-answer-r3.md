# Client answer: needs and validation for release 3

Answered by: Client (flight school operator), 2026-11-25.
Basis: recheck report (`report/recheck-new-reqseq.md`: W-09, W-10, W-20, W-21, W-22, the deferred need N-7bfc52), `report/recheck-detail-spec.md` (F-S-06, F-S-08, F-S-09, F-S-13, F-S-16, F-S-17), my earlier answers (release 1 rounds 1 and 2, release 2 needs and validation), the screenshots in `handoff/validation-screens/` and `handoff/run2/screens-r2/`, the need files and validation records as they are now on branch `claude/project-thread-k4uc75` (read only).

I decide about needs and their validation. I do not edit anything. Where I give a text, Req&Dev or IV&V can apply it 1:1.

## Summary of decisions

| # | Topic | Decision |
|---|---|---|
| 1 | W-09: validation records of N-a02a77, N-790a55, N-2c5472, N-e01992, N-e67c17, N-6d2299, N-6010df | **inconclusive**, all seven. What I saw on screenshots is met. A criterion that needs real operation has not been met, so the need is not validated. Reasons in section 1. |
| 2 | Same honesty check for the record of N-e9c5c6 (it says "validated in part" too) | **inconclusive**: on-screen keyboard and maximum landing mass are open |
| 3 | N-1e786e, N-cac39d, N-98a54d | **passed stays**: every criterion was met by what I actually saw |
| 4 | N-7bfc52 Record of the check | The criteria proposed on the branch are **not adequate**. Revised text and three criteria below. **Stays deferred** in release 3, priority **could** |
| 5 | N-a02a77 criterion 1 | **Change**: the pilot must see which planned fuel burn the landing result uses (my release 2 remark 1) |
| 6 | W-21 / F-S-13: "date of the aircraft data" | It means the mass and balance data of the selected aircraft. **Fuel report times never count.** I withdraw my release 2 acceptance of "aircraft data as of 2026-11-02". |
| 7 | W-22 / F-S-17: total mass below the lowest mass of the envelope | **Never "Within limits".** Outside the drawn envelope means outside limits. |
| 8 | W-20 / F-S-09: behaviour that no requirement specifies | Covered by my existing needs, so no new need. I want the three proposed SRs. The "Mass limit exceeded" label belongs to N-98a54d. |
| 9 | F-S-08 / W-04: HC-2 values in the criteria | Supported. "Each aircraft of the fleet" in my criteria includes HC2-01. |
| 10 | Priorities of all needs | **Unchanged** (table in section 3.7) |
| 11 | Versions moved from n1 to n2 (metamodel change 6b189dd) | Confirmed at n2 for the needs whose text, priority and criteria are unchanged (section 3.8). |
| 12 | W-10: D-c5b3b1 | Agreed: D-0588ba replaces it as the confirmation of the current needs. D-c5b3b1 stays as history of release 1. |
| 13 | F-S-06 "seat row" in N-6010df, F-S-16 "fuel module" in D-c5b3b1 | Need text unchanged. "Seat row" may become a glossary term. D-c5b3b1 is history and stays as it is. |

---

## 1. W-09: passed or inconclusive

### My rule

A need is validated when **every** one of its criteria was met in front of me. A criterion that names a real pilot, instructor, maintenance organisation, phone or aircraft has not been met in this project. A screenshot walk-through stood in for it, and in release 1 and release 2 I accepted that for the purpose "trial and acceptance, not flight operations" (D-a61e10). That acceptance still holds as a statement about the release. A per-need record "passed" says more than that, though: it says the need is validated. For these needs that is not true. Their own records say "Validated in part" and their own criteria say "not met in the pilot". So the honest record is **inconclusive**, with the open part as the reason.

This does not change my overall verdict on release 2: fit for trial with invented aircraft, not for flight operations. The field validation stays the condition for any real use.

### Decision per need

| Need | Record now | Decision | Met, by what I actually saw | Open |
|---|---|---|---|---|
| N-a02a77 Landing within limits before take-off | passed | **inconclusive** | crit. 1 for HC-4 (within both; within at take-off and outside at landing) and HC-2 (within at take-off and outside at landing); take-off and landing told apart | crit. 1: landing exactly on a limit after a real fuel burn, HC-2 "within both"; crit. 2: instructor against the released loading sheet |
| N-790a55 CG at once | passed | **inconclusive** | crit. 1 for HC4-01 (inside, on the aft limit, outside) and HC2-01 (edge and outside, release 1); crit. 3 on screenshots | crit. 1 for HC4-02 not shown; crit. 2 instructor; crit. 3 with the on-screen keyboard open |
| N-2c5472 Cross-check | passed | **inconclusive** | crit. 2 (rounding stated on screen); the totals of HC4-01 and HC4-02 (release 1) and HC4-01 take-off and landing (release 2), reproduced by me | crit. 1 by a real instructor with the released paper loading sheet |
| N-e01992 Phone | passed | **inconclusive** | crit. 2 (360 px, light and dark mode, no horizontal scrolling) | crit. 1: own phone, daylight and dim hangar |
| N-e67c17 Right data | passed | **inconclusive** | crit. 2 (identifier and type; own empty mass, lever arm and weighing date per aircraft) | crit. 1 maintenance organisation; crit. 3 real re-weighing before the next flight; the "data as of" date is wrong (W-21) |
| N-6d2299 No network or installation | passed | **inconclusive** | crit. 1 (no account, nothing installed) | crit. 2: flight mode on own phone. Not reaching the fuel report was shown only indirectly (the screenshot still shows the stored report). |
| N-6010df Enter what is on board | passed | **inconclusive** | crit. 2 (every load place of HC-4 and HC-2, fuel in litres) and crit. 3 (too much marked) | crit. 1: under one minute at the aircraft, timed |
| N-e9c5c6 Mass at once (extra, same pattern) | passed | **inconclusive** | crit. 1 (at and above the maximum take-off mass for HC4-01; for the fleet in release 1); crit. 2 on screenshots | crit. 2 with the on-screen keyboard open; whether the real aircraft has a separate maximum landing mass |
| N-1e786e Never a wrong "within limits" | passed | **passed stays** | every entry left out or implausible, including the three fuel cases: "Check not complete", never "within limits" | – |
| N-cac39d Reported fuel quantity | passed | **passed stays** | all three criteria | – |
| N-98a54d See where the load acts | passed | **passed stays** | crit. 1 and 2 (outside picture and limit labels in release 1; take-off and landing points in release 2) | – |

### How to record it (for IV&V)

- Do not delete or edit the release 2 "passed" records. They belong to baseline `release-2` and show what was claimed then. Add a new record at the **current** version of each need, dated in release 3. That record is the one that counts.
- Keep this file as evidence next to the new records, for example `spec/evidence/validation/r3/client-answer-r3.md`, as was done in release 2. IV&V decides the exact folder.
- Command form: `reqseq evidence record <need> validation inconclusive --reason "<text>" --evidence client-answer-r3.md --folder evidence/validation/r3`
- If a need's version changes again in release 3 (N-a02a77, see 3.2), record it after that change.
- Afterwards check `reqseq evidence status --where-type need`. Each of the eight should show `inconclusive`, not `validated`. If ReqSeq still shows `validated` from the older passed record, that is a finding against ReqSeq.

Exact reason texts (one line each, for `--reason`):

- **N-a02a77:** `Release 2 screenshots meet criterion 1 for HC-4 and HC-2 within at take-off and outside at landing, and HC-4 within both, with take-off and landing told apart. Not met: criterion 1 for a landing exactly on a limit after a real fuel burn and for HC-2 within both; criterion 2 (instructor against the released loading sheet) needs real operation. Open for the field validation before any real use.`
- **N-790a55:** `Screenshots meet criterion 1 for HC4-01 (inside, on the aft limit, outside) and HC2-01 (edge, outside) and criterion 3 without the on-screen keyboard. Not met: criterion 1 for HC4-02; criterion 2 (instructor against the released loading sheet) and criterion 3 with the on-screen keyboard open need real operation. Open for the field validation before any real use.`
- **N-2c5472:** `Criterion 2 met: the rounding is stated on screen, and the client reproduced the take-off and landing totals from the screenshots. Not met: criterion 1 (a real instructor with the released paper loading sheet) needs real operation. Open for the field validation before any real use.`
- **N-e01992:** `Criterion 2 met: at 360 px in light and dark mode every entry and result is readable without horizontal scrolling. Not met: criterion 1 (readable on the pilot's own phone in daylight and in a dim hangar) needs real operation; screenshots cannot show it. Open for the field validation before any real use.`
- **N-e67c17:** `Criterion 2 met: identifier and type, and each aircraft's own empty mass, lever arm and weighing date, are shown. Not met: criterion 1 (maintenance organisation against its released data) and criterion 3 (a real re-weighing in use before the next flight) need real operation. The offline date of the aircraft data shows a fuel report date (recheck W-21), so the client's release 2 acceptance of it is withdrawn until it is corrected.`
- **N-6d2299:** `Criterion 1 met: the app opens as a web page without account or installation. Not met: criterion 2 (flight mode on the pilot's own phone, also with no fuel report reachable) needs real operation; the walk-through still showed a stored fuel report. Open for the field validation before any real use.`
- **N-6010df:** `Criteria 2 and 3 met: every load place of HC-4 and HC-2 including fuel in litres can be entered, and too much is marked. Not met: criterion 1 (a pilot enters a training flight at the aircraft in under one minute without help) needs real operation and timing. Open for the field validation before any real use.`
- **N-e9c5c6:** `Criterion 1 met from the walk-throughs (at and above the maximum take-off mass). Not met: criterion 2 with the on-screen keyboard open needs a real phone, and whether the real aircraft has a separate maximum landing mass needs its flight manual. Open for the field validation before any real use.`

Note for the final report: with this decision, the exit criterion "every Need validated" is not met for eight needs. The reason is the one brief section 6 foresees: real people and real operation. That is the honest state, and I prefer it to a green record.

---

## 2. N-7bfc52 Record of the check

### Assessment of the criteria on the branch

The working copy holds two proposed criteria:

1. "after a check of a loading, the flight school operator finds in the record the aircraft, the date, every entry and both limit indications of that check": the right direction, but not testable as written. It gives no prepared case or example values. It does not say that the values must **agree** with what the pilot saw. It does not say whether the fuel figure was reported or the pilot's own. It leaves out the incomplete check.
2. "Needs real operation: not met in the pilot; the need is deferred and no requirement derives from it": this is a status note, not a criterion. It also says the whole need needs real operation, which is not true. Most of it can be shown with a walk-through. Only the step "the record reaches the flight school's files" needs real operation.

Also, the "result" in the need text is now two results (take-off and landing), and the text says nothing about when the record is made. So the text needs updating as well.

### Exact texts

**Text:**
> The flight school operator needs, for each flight, a record of the loading check made before it: the aircraft, the date and time, every entry and the result at take-off and at landing.

**Priority:** `could` (unchanged)

**Validation criteria:**
1. `For a check prepared by the instructor (HC4-01, the pilot's own fuel figure instead of the reported one, a planned fuel burn, within limits at take-off and outside limits at landing), the instructor opens the record of that check and reads the aircraft identifier, the date and time in UTC, every entry with its unit, whether the fuel figure was reported or the pilot's own, and the result at take-off and at landing; every value agrees with the screen of that check.`
2. `For a check that is not complete, the record says that the check was not complete and shows no limit result.`
3. `A pilot makes the check at the aircraft with the phone in flight mode and passes its record to the flight school without an account; the flight school operator files it with the papers of the flight. Needs real operation: not met in the pilot; a scenario walk-through stands in until the field validation with real people at a real aircraft.`

**Rationale:**
> Client remark from release 1, priority could. Deferred again by the client for release 3: release 3 corrects the specification and the evidence of the existing needs, and the app is not used regularly with students before the field validation, so the record is not needed earlier. It is needed before the app is used regularly with students. No requirement derives from it while it is deferred.

**Status:** stays `draft`. Replace `based-on` with the scope decision of release 3 if one is created. Otherwise keep D-b70292 and name the deferral for release 3 in it. **Release 2 is not a valid reason for release 3**, so the reason needs a decision that covers release 3.

### Why it stays deferred

- Release 3 is about honesty and quality of the existing chain (W-03, W-04, W-09, W-13, W-20, W-21). A new feature with stored personal data (who flew, what they carried) adds new risks and new requirements. That is not what this release is for.
- I said I want the record "before we use the app regularly with students". That cannot happen before the field validation, which is open anyway. Deferring it costs me nothing today.
- The need limit is not the reason: N-7bfc52 is already counted in the 12.
- With these criteria the need is ready to be brought in later without another round with me.

---

## 3. Other need-level findings

### 3.1 W-21 / F-S-13: what "date of the aircraft data" means (N-e67c17, N-6d2299)

In release 2 I accepted "Offline: aircraft data as of 2026-11-02" as the date I had asked for. I was wrong to accept it. HC4-01 was weighed on 2026-03-02, and 2026-11-02 is the time of a fuel report. A pilot would read it as "the aircraft data is fresh", and that is exactly the misreading this notice should prevent.

My decision on the meaning (for SR-55a648 and a glossary term):
> The date of the aircraft data is the date on which the mass and balance data of the selected aircraft (its empty mass, empty-mass lever arm and the limits of its type) in the app was last changed. The time of a fuel report never counts toward it; the fuel report time is shown with the fuel figure.

If the data file holds no such change date, the weighing date of the selected aircraft is good enough for me. No need text changes.

### 3.2 N-a02a77: change to criterion 1 (my release 2 remark 1)

In the release 2 screenshots the result panel covers "Planned fuel burn" (for example `N-a02a77-landing-outside.png`). I cannot see which burn the landing result is based on. A student must be able to see it.

New criterion 1 (exact text; criterion 2 unchanged):
> For each aircraft type, for three loadings with fuel and a planned fuel burn prepared by the instructor (one within limits at take-off and at landing, one within limits at take-off but outside at landing, one with the landing exactly on a limit), the pilot names the correct landing result from the screen without calculating; a loading exactly on a limit counts as within limits; the pilot can tell from the screen which result is for take-off and which is for landing, and which planned fuel burn the landing result uses.

I confirm N-a02a77 in its new version with this text, unchanged priority `must` and unchanged text. No further round is needed.

### 3.3 W-22 / F-S-17: total mass below the lowest mass of the envelope

The envelope I validated is the drawn polygon with its corner table ("boundary included"). A point outside it must never show "Within limits". That includes a total mass below the lowest corner mass. This follows from N-790a55 and N-e9c5c6 ("within the permitted limits") and from the spirit of N-1e786e. It cannot happen with today's fleet, but a new data file could trigger it.

Decision: such a loading is shown as **outside limits**, naming the mass, for example "total mass below the envelope". Amend D-a30083 and SR-687e88; GT-a15850fdab45 (envelope) can stay "closed polygon". No need text changes.

### 3.4 W-20 / F-S-09: behaviour without a requirement

From my side these are covered by existing needs, so no new need:
- (a) A fuel interface version the app does not understand, and (b) an unreadable aircraft or fuel data file: the app shows **no limit result** and says that the check cannot be done with this data. Origin: N-1e786e (never a wrong "within limits") and N-e67c17 (right data). The pilot must never see a result computed from data the app could not read properly.
- (c) No fuel report for the selected aircraft: the pilot sees that there is no report and enters their own figure; the check works with it. Origin: N-cac39d and N-6d2299 (my condition from the release 2 needs answer).
- (d) The label "Mass limit exceeded": I want it. Origin: N-98a54d criterion 2 ("which limit (forward, aft or mass)").

I support the three proposed SRs and the AC for the mass label. Their wording is for Req&Dev and IV&V.

### 3.5 F-S-08 / W-04: HC-2 in the criteria

My criteria in N-790a55, N-e9c5c6 and N-a02a77 say "for each aircraft of the fleet" or "for each aircraft type". For me HC2-01 is part of that. I support giving the core requirements that apply to the HC-2 their own HC-2 criteria with HC2-01 values, at least the safety-related ones. No need text changes.

### 3.6 N-e9c5c6: maximum landing mass

No change. For the invented aircraft, D-b70292 item 4 stands (landing mass compared with the maximum take-off mass). Whether a real aircraft has a separate maximum landing mass stays an open field-validation item (see the reason text in section 1).

### 3.7 Priorities

Unchanged and confirmed: N-1e786e must, N-a02a77 must, N-790a55 must, N-2c5472 should, N-cac39d must, N-e01992 must, N-e9c5c6 must, N-98a54d should, N-e67c17 must, N-6d2299 must, N-6010df must, N-7bfc52 could.

### 3.8 Re-confirmation after the version change

All needs moved to `n2` versions with the metamodel change 6b189dd. I confirm the following needs at these versions **on the condition** that their text, priority and validation criteria are word for word those of my release 2 confirmation (D-0588ba). IV&V checks this with a diff before relying on it.

| Need | Version confirmed |
|---|---|
| N-1e786e | n2:09b223444b88c7a9 |
| N-790a55 | n2:c9600efe15d7249e |
| N-2c5472 | n2:e25d611e8c9554c7 |
| N-cac39d | n2:5a9c7ae27aab9964 |
| N-e01992 | n2:32f913da023ef653 |
| N-e9c5c6 | n2:0cc7ab4f62981fdc |
| N-98a54d | n2:4005d952761e460c |
| N-e67c17 | n2:32640abb0f932a24 |
| N-6d2299 | n2:0c1fd21a8e57c319 |
| N-6010df | n2:393742df396347e0 |

- N-a02a77 is confirmed in the version with the new criterion 1 of 3.2.
- N-7bfc52 is not confirmed: it stays a draft with the texts of section 2.
- The fuel needs N-bd1cee, N-b57070, N-d2ad9d and N-51e2a9 belong to the supplier and integrator, not to me.

### 3.9 W-10: D-c5b3b1

Agreed. My release 2 confirmation (D-0588ba) is the confirmation of the current needs and replaces D-c5b3b1 for them. D-c5b3b1 is correct as a record of release 1 and must stay readable. Who sets the status is up to IV&V.

### 3.10 Wording (F-S-06, F-S-16)

- "occupants on each seat row" in N-6010df is my wording, and I keep it. It means the front seats and the rear seats. Req&Dev may add a glossary term "seat row" ("a row of seats that is one loading station, for example the front seats") or reword SR-e95f42. The need text does not change.
- "fuel module" in D-c5b3b1 is a quote of history. Leave it; current needs say "fuel system module".

---

## 4. Addendum (2026-11-25): Q-R3-01 and check of the applied need changes

### Q-R3-01 Maximum take-off mass shown with the selected aircraft: decision (a) keep the figure

**Keep the figure on screen, in both builds** (HC-4: 1150 kg, HC-2: 880 kg).

Why:
- **N-e9c5c6 (mass at once):** the pilot sees whether the mass is permitted. That is clearest when the limit stands next to the total mass the app shows. In the screenshots I validated, the figure is part of what I saw ("Maximum take-off mass 1150 kg"). Removing it takes away something the pilot uses today.
- **N-e67c17 criterion 1:** the maintenance organisation compares the **type limits** with its released data. The maximum take-off mass is one of those limits, just as the envelope corners are. I asked in release 1 for the limits to be shown as numbers for exactly this reason.
- **N-2c5472:** the instructor cross-checks the result with the paper loading sheet, which states the maximum take-off mass.

So the second origin of the new requirement is N-e67c17, next to N-e9c5c6.

The HC-2 build must show its own figure (880 kg). "Each aircraft type" includes the HC-2 (3.5).

Going from 76 to 78 system requirements is a project matter for D-cb5556 and IV&V. From my side the two requirements are necessary, not gold-plating. If IV&V finds a way to cover both builds within the limit without mixing HC-4 and HC-2 criteria in one requirement (recheck W-03), that is fine with me too. What I need is the figure on screen in both builds, each with its own test.

### Check of the applied need changes (branch `claude/project-thread-k4uc75`, at 234f800)

| Need | Check against this answer | Result |
|---|---|---|
| N-a02a77 | Criterion 1 is word for word section 3.2 ("… and which planned fuel burn the landing result uses."). Criterion 2, text, priority `must` and stakeholders are unchanged. Status `draft` until IV&V approves. | **matches**; confirmed in this version |
| N-7bfc52 | Text, the three criteria, rationale and priority `could` are word for word section 2; status `draft`; `based-on` Scope of release 3 (D-cb5556). | **matches** |

No other need text changed (Req&Dev's list, items 1–10 in `client-questions.md`). The applications of my other decisions in that list agree with sections 3.1 to 3.10.
