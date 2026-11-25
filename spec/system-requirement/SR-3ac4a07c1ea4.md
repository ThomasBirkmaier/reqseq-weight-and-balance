---
id: 995be90c-c46e-4cc6-bfce-3ac4a07c1ea4
type: system-requirement
status: approved
title: Indication within limits in the HC-2 build
rationale: "The pilot needs a clear positive result; it is shown only when neither limit is exceeded, so that a loading outside limits is never shown as within limits. HC-2 replacement of SR-3a4905: the statement of SR-3a4905 with acceptance criteria from the type data of the Halcyra HC-2, because ReqSeq has no validity per acceptance criterion (scope of release 3)."
requirement-type: functional
acceptance-criteria:
  - key: p8jn
    text: Given the aircraft HC2-01 is selected in the HC-2 build, when the pilot enters 160 kg front seats, 20 kg baggage compartment, 50 L usable fuel at take-off and 30 L planned fuel burn (856 kg, 2.137 m), then the limit indication labelled "Take-off" shows "Within limits".
  - key: fk8j
    text: Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 200 kg front seats and 40 kg baggage compartment (exactly 880 kg, the maximum take-off mass), then the take-off limit indication shows "Within limits".
  - key: tp9y
    text: Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 75 kg front seats and 35 kg baggage compartment (750 kg, exactly 2.170 m on the aft limit), then the take-off limit indication shows "Within limits".
validity:
  - { id: 05ae9286-bea0-45ad-9338-d1f959f23826, version: n2:22b0303ec030d854, title: Halcyra HC-2 }
packages:
  - { id: 6dfd18aa-ad50-4c68-9c54-1bb4df983f84, version: n2:22b0303ec030d854, title: Variant Halcyra HC-2 }
verification-method: test
criticality: high
safety-related: "yes"
mitigates:
  - { id: 928d06c2-e31e-4d1d-b65a-1540215c7c88, version: n2:1fbd4c18a15e3e37, title: Centre of gravity outside the envelope shown as within limits }
  - { id: 940f506c-3351-448c-ae22-55695995b4e0, version: n2:b4bf55b55c25f99d, title: Total mass above the maximum take-off mass shown as within limits }
derives-from:
  - { id: 1e298834-92c8-438a-8296-9786b6e9c5c6, version: n2:0cc7ab4f62981fdc, title: Know at once whether the mass is permitted }
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n2:c9600efe15d7249e, title: Know at once whether the centre of gravity is permitted }
  - { id: 6348e5a1-fa96-41b1-b9ab-07dd281e786e, version: n2:09b223444b88c7a9, title: Never a wrong "within limits" }
based-on:
  - { id: a016275b-69c9-4bbe-bf70-4ee6afa30083, version: n2:f2651947f0abaedb, title: Limit check rule }
  - { id: 153a5bdf-6759-4d0e-80d9-20b0c691084e, version: n2:365059b56a0b1a75, title: Type data of the Halcyra HC-2 }
replaces:
  - { id: 1669da39-c0ed-4309-ae48-a60cc03a4905, version: n2:f05f2a2f7a9546f7, title: Indication within limits }
---

If a valid loading at take-off is within limits according to the limit check rule, the system shall show the take-off limit indication "Within limits".
