---
id: 109946de-c77a-44bf-81ff-eeacde29562e
type: system-requirement
status: draft
title: Centre of gravity
rationale: The pilot and the instructor read the centre of gravity to compare it with the envelope and the paper loading sheet.
requirement-type: functional
acceptance-criteria:
  - Given the aircraft HC4-01 is selected, when the pilot enters 160 kg front seats, 0 kg rear seats and 20 kg baggage compartment, then the centre of gravity shows 2.270 m.
  - Given the aircraft HC4-01 is selected, when the pilot enters 70 kg front seats, 200 kg rear seats and 50 kg baggage compartment, then the centre of gravity shows 2.495 m.
packages:
  - { id: 0ad97c1b-beb1-48a1-b1f8-30914e45a7c4, version: n1:67ebd0624004c969, title: Calculation core }
verification-method: test
criticality: high
safety-related: "no"
derives-from:
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n1:4023d54cdabf064f, title: Know at once whether the centre of gravity is permitted }
  - { id: 100e9969-73c0-423b-b96f-708da92c5472, version: n1:6be63f5bdc19bc58, title: Cross-check the calculation }
based-on:
  - { id: d9378504-282e-4688-918c-d6c354e582bf, version: n1:4c2143a0ef586692, title: "Units, input resolution and rounding" }
---

If every mass entry of the loading is valid, the system shall show the centre of gravity in m rounded to 0.001 m.
