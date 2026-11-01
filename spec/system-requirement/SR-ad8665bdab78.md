---
id: f9ba2c1d-005d-41a5-bb18-ad8665bdab78
type: system-requirement
status: draft
title: Data of the Halcyra HC-4
rationale: The result is only correct with the released data of the aircraft actually flown.
requirement-type: functional
acceptance-criteria:
  - Given the aircraft HC4-01 is selected, when every entry is empty, then the total mass shows 765 kg and the centre of gravity 2.220 m.
  - Given the aircraft HC4-02 is selected, when every entry is empty, then the total mass shows 778 kg and the centre of gravity 2.236 m.
  - Given the aircraft HC4-01 is selected, when every entry is empty, then the maximum take-off mass shows 1150 kg.
packages:
  - { id: 0ad97c1b-beb1-48a1-b1f8-30914e45a7c4, version: n1:67ebd0624004c969, title: Calculation core }
verification-method: test
criticality: high
safety-related: "no"
derives-from:
  - { id: fd4c0543-9439-46c0-8519-d50f6fe67c17, version: n1:e70ddeb6853e0bf2, title: Right data for the individual aircraft }
based-on:
  - { id: 8af32ef6-642a-4c83-9c76-b554fd14600e, version: n1:5d36ba776734cb00, title: Type data of the Halcyra HC-4 }
---

If an aircraft of the type Halcyra HC-4 is selected, the system shall use the type data of the Halcyra HC-4 and the empty mass of the selected aircraft as recorded in the type data decision.
