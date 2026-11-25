---
id: f0c03471-5bc9-4c0c-9e2b-30c2eecfa742
type: system-requirement
status: draft
title: Centre of gravity in the HC-2 build
rationale: "The pilot and the instructor read the centre of gravity to compare it with the envelope and the paper loading sheet. Not safety-related: a wrong figure here cannot by itself make a loading outside the limits appear within limits, because the limit indications, which are safety-related, come from the unrounded values by the limit check rule; IV&V confirms this classification. HC-2 replacement of SR-29562e: the statement of SR-29562e with acceptance criteria from the type data of the Halcyra HC-2, because ReqSeq has no validity per acceptance criterion (scope of release 3)."
requirement-type: functional
acceptance-criteria:
  - key: m0tc
    text: Given the aircraft HC2-01 is selected in the HC-2 build, when the pilot enters 160 kg front seats, 20 kg baggage compartment, 50 L usable fuel at take-off and 30 L planned fuel burn, then the centre of gravity at take-off shows 2.137 m.
  - key: xwk7
    text: Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 60 kg front seats and 40 kg baggage compartment, then the centre of gravity at take-off shows 2.178 m.
  - key: dtbh
    text: Given the aircraft HC2-01 is selected in the HC-2 build, when the pilot enters 160 kg front seats, 20 kg baggage compartment, 50 L usable fuel at take-off and 30 L planned fuel burn, then the landing result shows the centre of gravity at landing 2.138 m ("Landing 834 kg at 2.138 m").
validity:
  - { id: 05ae9286-bea0-45ad-9338-d1f959f23826, version: n2:22b0303ec030d854, title: Halcyra HC-2 }
packages:
  - { id: 6dfd18aa-ad50-4c68-9c54-1bb4df983f84, version: n2:22b0303ec030d854, title: Variant Halcyra HC-2 }
verification-method: test
criticality: high
safety-related: "no"
derives-from:
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n2:c9600efe15d7249e, title: Know at once whether the centre of gravity is permitted }
  - { id: 100e9969-73c0-423b-b96f-708da92c5472, version: n2:e25d611e8c9554c7, title: Cross-check the calculation }
  - { id: 031a08ff-81c7-41c9-b740-156684a02a77, version: n2:02af7ab74c3a1a1d, title: Know before take-off whether the landing is within limits }
based-on:
  - { id: d9378504-282e-4688-918c-d6c354e582bf, version: n2:f623091fdc76332a, title: "Units, input resolution and rounding" }
  - { id: 153a5bdf-6759-4d0e-80d9-20b0c691084e, version: n2:365059b56a0b1a75, title: Type data of the Halcyra HC-2 }
replaces:
  - { id: 109946de-c77a-44bf-81ff-eeacde29562e, version: n2:08184a47c493bb76, title: Centre of gravity }
---

If every entry of the loading is valid, the system shall show the centre of gravity at take-off and the centre of gravity at landing, each in m rounded to 0.001 m.
