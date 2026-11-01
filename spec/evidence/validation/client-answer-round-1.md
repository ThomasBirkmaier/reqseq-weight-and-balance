# Client answer: validation of release 1 (run 1)

Answered by: Client (flight school operator), 2026-11-01.
Basis: the screenshots in the walk-through screenshots in this folder. The live app could not be reached from my side (connection refused), so I could not use it on a phone myself.

## Summary

| # | Criterion | Answer |
|---|---|---|
| 1 | N-6010df: entry in under one minute without help | cannot judge |
| 2 | N-6010df: every load place can be entered | met (HC-4); HC-2 not shown |
| 3 | N-790a55: results agree with the paper loading sheet | partly met: arithmetic agrees; cannot judge against the released sheet |
| 4 | N-790a55 / N-e9c5c6: result visible without scrolling or a button | met on the screenshots, with one remark |
| 5 | N-2c5472: instructor reproduces two loadings within the rounding | met |
| 6 | N-e01992: readable in daylight and in a dim hangar | cannot judge |
| 7 | N-e01992: no account or install; works in flight mode | no account: met. Flight mode: cannot judge |
| 8 | N-98a54d: fix a loading from the pictures; tell which limit | met |
| 9 | N-e67c17: data agree with the released data | cannot judge (maintenance organisation needed); one remark |
| 10 | N-e67c17: new empty mass in use before the next flight | met when the app is opened with network; open point without network |

Overall: I see nothing in the screenshots that is wrong in the results. Release 1 is **not yet fully validated**. Criteria 1, 6 and the flight-mode part of 7 need a pilot with a real phone at the aircraft. Criteria 3 and 9 need the released loading sheet and the maintenance organisation. Criterion 10 has an open point when there is no network.

## Per criterion

### 1. N-6010df: enter a typical training flight in under one minute without help: cannot judge

This is a timed test by a pilot on their own phone. Screenshots cannot show it. The screen looks simple enough: three fields in whole kilograms with the limit shown in each label. I expect it to pass, but a pilot of ours has to do it and be timed.

### 2. N-6010df: every place where load can be put in release 1 can be entered: met (HC-4)

For the HC-4 the screens show front seats, rear seats and baggage compartment, in the entry form, the aircraft picture and the calculation table. That is every place in release 1 (fuel excluded, as agreed). I saw no screenshot of the HC-2 entry form. I accept it if the HC-2 shows its seats and baggage in the same way.

Remark: in `N-6010df-1-entries.png` and `N-6010df-2-too-much.png` the result panel at the bottom covers the rear seats field and everything below it. In the "too much" case, the entry that is marked as wrong is exactly the one hidden under the panel. The pilot must scroll to find it. Please make sure the field being edited or marked as wrong is never hidden by the panel.

### 3. N-790a55: instructor confirms inside / edge / outside against the paper loading sheet: partly met

The aircraft is invented, so there is no released paper loading sheet I can hold against the screens. What I could check:

- HC4-01: inside 945 kg / 2.219 m, edge 1085 kg / 2.470 m (exactly on the aft limit, shown as within limits, as agreed), outside 1085 kg / 2.475 m (outside, centre of gravity). The results agree with the envelope picture, and the arithmetic in the calculation tables agrees when I redo it.
- HC2-01: edge 750 kg / 2.170 m within, outside 740 kg / 2.178 m outside. I cannot check these without the HC-2 limits as numbers.

To complete this criterion, an instructor needs the loading sheet of each type and has to compare it with all six cases (HC-4 including HC4-02, and HC-2).

### 4. Result visible without scrolling or a button after the last entry: met on the screenshots

In every result screenshot, the result panel (green, red or amber) is fixed at the bottom of the screen and shows the result, total mass and centre of gravity. There is no calculate button. Remark: on a real phone the on-screen keyboard takes half of the screen. A pilot should confirm on their own phone that the panel is still visible while typing the last entry.

### 5. N-2c5472: instructor reproduces two loadings within the stated rounding: met

I redid both tables by hand:
- HC4-01 (160 / 0 / 20 kg): moments 1698.3 + 320.0 + 0.0 + 79.0 = 2097.3 kg·m; 2097.3 / 945 = 2.219 m. Agrees.
- HC4-02 (100 / 100 / 10 kg): 1739.6 + 200.0 + 325.0 + 39.5 = 2304.1 kg·m; 2304.1 / 988 = 2.332 m. Agrees.

The rounding is stated on the screen ("Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m"). The table looks like our paper loading sheet, which our instructors will like.

### 6. N-e01992: readable in daylight and in a dim hangar: cannot judge

All screenshots are in light mode, and none show dark mode. Readability in sunlight and in a dark hangar can only be judged on a real phone. To me the light screens look clear and high in contrast.

### 7. N-e01992: no account or install; works in flight mode after one opening: partly

- No account and no install: met. No screen asks for sign-in, and it opens as a web page.
- Flight mode: cannot judge. `N-e01992-offline.png` looks the same as a normal screen, with nothing on it that shows the phone was offline. A pilot needs to test this on their own phone.

### 8. N-98a54d: propose a fix from the pictures and tell which limit is exceeded: met

- Aft case: the envelope shows a red cross outside the right edge and the label "Aft limit exceeded". From the picture, a pilot sees the rear seats (200 kg) and baggage (50 kg) are heavy. Moving less load to the rear (rear 120 kg, `-2-corrected.png`) brings the point well inside. I checked the corrected loading: 1005 kg, 2.414 m, inside.
- Forward and mass cases are labelled "Forward limit exceeded" and "Mass limit exceeded", and the cross sits at the right place.

### 9. N-e67c17: maintenance organisation compares the data: cannot judge

This needs our maintenance organisation and its released data, which does not exist for invented aircraft. What the screens show per aircraft: identifier, type, empty mass, empty-mass lever arm, weighing date and maximum take-off mass. These values differ between HC4-01, HC4-02 and HC2-01, as they should.

Remark: the forward and aft limits of each type appear only as a picture, not as numbers. A maintenance engineer cannot compare a picture with released data. Please show the envelope corner values as numbers somewhere in the app, for example below the envelope picture.

### 10. N-e67c17: new empty mass in use before the next flight: met when opened with network, open point without network

After the re-weighing, the screen shows the new values (771 kg at 2.224 m, weighed 2026-10-30). Showing the weighing date is good: a pilot can compare it with the aircraft documents.

Open point: the new value only arrives when the app is opened with network. We said in round 1 that our hangar has poor reception. A pilot who opens the app only at the aircraft could still see the old empty mass without knowing it. For release 1 (not for flight operations) I accept this. Before release 2 is used for real flights, we need the app to show when the aircraft data was last updated. Our procedure will also be that pilots check the weighing date against the aircraft documents.

## Smaller finding

On an empty form, the panel reads "Check not complete: correct the marked entries" before the pilot has typed anything. "Correct" sounds like the pilot made a mistake. Better: "Check not complete: enter the load in every marked field." Not blocking.

