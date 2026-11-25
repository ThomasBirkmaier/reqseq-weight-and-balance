---
id: 08c5d8ec-9fae-4ffd-83e0-cddbb6a93b59
type: system-requirement
status: draft
title: Indication of a centre of gravity outside the envelope in the HC-2 build
rationale: "Replaces SR-687e88 in the HC-2 build with acceptance criteria from the type data of the Halcyra HC-2: ReqSeq has no validity per acceptance criterion, so the criteria of the variant need a requirement of the variant (scope of release 3)."
requirement-type: functional
acceptance-criteria:
  - key: srwc
    text: "Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 220 kg front seats and 0 kg baggage compartment (860 kg, 2.112 m, forward limit 2.118 m), then the take-off limit indication shows \"Outside limits: centre of gravity outside envelope\" and does not show \"Within limits\"."
  - key: qq3j
    text: "Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 60 kg front seats and 40 kg baggage compartment (740 kg, 2.178 m, aft limit 2.170 m), then the take-off limit indication shows \"Outside limits: centre of gravity outside envelope\" and does not show \"Within limits\"."
  - key: tkf9
    text: "Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 75 kg front seats and 35 kg baggage compartment (750 kg, exactly on the aft limit 2.170 m), then the take-off limit indication does not show \"Outside limits: centre of gravity outside envelope\"."
validity:
  - { id: 05ae9286-bea0-45ad-9338-d1f959f23826, version: n2:22b0303ec030d854, title: Halcyra HC-2 }
packages:
  - { id: 6dfd18aa-ad50-4c68-9c54-1bb4df983f84, version: n2:22b0303ec030d854, title: Variant Halcyra HC-2 }
verification-method: test
criticality: high
safety-related: "yes"
mitigates:
  - { id: 928d06c2-e31e-4d1d-b65a-1540215c7c88, version: n2:1fbd4c18a15e3e37, title: Centre of gravity outside the envelope shown as within limits }
derives-from:
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n2:c9600efe15d7249e, title: Know at once whether the centre of gravity is permitted }
based-on:
  - { id: a016275b-69c9-4bbe-bf70-4ee6afa30083, version: n2:f2651947f0abaedb, title: Limit check rule }
  - { id: 153a5bdf-6759-4d0e-80d9-20b0c691084e, version: n2:365059b56a0b1a75, title: Type data of the Halcyra HC-2 }
replaces:
  - { id: 3d7f9eda-d927-4a0f-9efe-917d8c687e88, version: n2:4b617bb739f68a98, title: Indication of a centre of gravity outside the envelope }
---

If the centre of gravity of a valid loading at take-off is forward of the forward limit or aft of the aft limit of the envelope at its total mass, the system shall show the take-off limit indication "Outside limits: centre of gravity outside envelope".
