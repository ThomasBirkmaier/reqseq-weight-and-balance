---
id: b5c6cedb-dcab-4fbb-affa-dd81e46c5e0c
type: system-requirement
status: draft
title: Maximum take-off mass shown with the selected aircraft
rationale: "The pilot sees at once whether the total mass is permitted when the limit stands next to it, the maintenance organisation compares the type limits with its released data, and the instructor compares the figure with the paper loading sheet (client decision Q-R3-01 of release 3). Not safety-related: a wrong figure here cannot by itself make a loading above the maximum take-off mass appear within limits, because the limit indications, which are safety-related, use the type data directly."
requirement-type: functional
acceptance-criteria:
  - key: kj10
    text: Given the core build is open, when the pilot selects HC4-01, then the app shows "Maximum take-off mass 1150 kg" next to the selected aircraft.
packages:
  - { id: 7ca2dae5-b8a7-44de-a6c7-9542ff2e84f3, version: n2:22b0303ec030d854, title: Loading and display }
verification-method: test
criticality: high
safety-related: "no"
derives-from:
  - { id: 1e298834-92c8-438a-8296-9786b6e9c5c6, version: n2:0cc7ab4f62981fdc, title: Know at once whether the mass is permitted }
  - { id: fd4c0543-9439-46c0-8519-d50f6fe67c17, version: n2:32640abb0f932a24, title: Right data for the individual aircraft }
based-on:
  - { id: 8af32ef6-642a-4c83-9c76-b554fd14600e, version: n2:5d6477e724aa36ba, title: Type data of the Halcyra HC-4 }
---

If an aircraft is selected, the system shall show the maximum take-off mass of its aircraft type next to the selected aircraft.
