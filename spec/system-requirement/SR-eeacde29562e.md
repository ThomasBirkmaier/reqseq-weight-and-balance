---
id: 109946de-c77a-44bf-81ff-eeacde29562e
type: system-requirement
status: approved
title: Centre of gravity
rationale: The pilot and the instructor read the centre of gravity to compare it with the envelope and the paper loading sheet.
requirement-type: functional
acceptance-criteria:
  - Given the aircraft HC4-01 is selected, when the pilot enters 160 kg front seats, 0 kg rear seats, 20 kg baggage compartment, 100 L usable fuel at take-off and 60 L planned fuel burn, then the centre of gravity at take-off shows 2.229 m.
  - Given the aircraft HC4-01 is selected with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 70 kg front seats, 200 kg rear seats and 50 kg baggage compartment, then the centre of gravity at take-off shows 2.475 m.
  - Given the aircraft HC4-01 is selected, when the pilot enters 160 kg front seats, 0 kg rear seats, 20 kg baggage compartment, 100 L usable fuel at take-off and 60 L planned fuel burn, then the landing result shows the centre of gravity at landing 2.223 m ("Landing 974 kg at 2.223 m").
packages:
  - { id: 0ad97c1b-beb1-48a1-b1f8-30914e45a7c4, version: n1:67ebd0624004c969, title: Calculation core }
verification-method: test
criticality: high
safety-related: "no"
derives-from:
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n1:997da7ed8d9f3ec8, title: Know at once whether the centre of gravity is permitted }
  - { id: 100e9969-73c0-423b-b96f-708da92c5472, version: n1:2141600b57cc64b3, title: Cross-check the calculation }
  - { id: 031a08ff-81c7-41c9-b740-156684a02a77, version: n1:119f7845779c91b3, title: Know before take-off whether the landing is within limits }
based-on:
  - { id: d9378504-282e-4688-918c-d6c354e582bf, version: n1:49bc78ee17b2010d, title: "Units, input resolution and rounding" }
---

If every entry of the loading is valid, the system shall show the centre of gravity at take-off and the centre of gravity at landing, each in m rounded to 0.001 m.
