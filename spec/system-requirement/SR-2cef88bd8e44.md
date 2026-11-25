---
id: 6f66b38c-391f-4701-b23e-2cef88bd8e44
type: system-requirement
status: draft
title: Limit indication at landing in the HC-2 build
rationale: "Burning fuel moves the centre of gravity: with the fuel lever arm forward of a loaded centre of gravity, the centre of gravity moves aft during the flight. The pilot must know before take-off whether the landing is within limits. HC-2 replacement of SR-90608c: the statement of SR-90608c with acceptance criteria from the type data of the Halcyra HC-2, because ReqSeq has no validity per acceptance criterion (scope of release 3)."
requirement-type: functional
acceptance-criteria:
  - key: yhsm
    text: Given the aircraft HC2-01 is selected in the HC-2 build, when the pilot enters 160 kg front seats, 20 kg baggage compartment, 50 L usable fuel at take-off and 30 L planned fuel burn (landing 834 kg at 2.138 m), then the limit indication labelled "Landing" shows "Within limits".
  - key: dnhh
    text: "Given the aircraft HC2-01 is selected in the HC-2 build, when the pilot enters 60 kg front seats, 35 kg baggage compartment, 52 L usable fuel at take-off and 10 L planned fuel burn (take-off 772 kg at 2.1699 m; landing 765 kg at 2.1706 m, aft limit 2.170 m), then the take-off limit indication shows \"Within limits\" and the landing limit indication shows \"Outside limits: centre of gravity outside envelope\"."
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
  - { id: c01c78a7-7920-43cc-aadb-45a5f709ad87, version: n2:844bb1e844cd58b2, title: Wrong fuel quantity or fuel data used for a limit indication }
derives-from:
  - { id: 031a08ff-81c7-41c9-b740-156684a02a77, version: n2:02af7ab74c3a1a1d, title: Know before take-off whether the landing is within limits }
based-on:
  - { id: a016275b-69c9-4bbe-bf70-4ee6afa30083, version: n2:f2651947f0abaedb, title: Limit check rule }
  - { id: 2f23eb42-057f-44ec-88cd-10a960b70292, version: n2:3b5d2ed04bb7dd58, title: Scope of release 2 }
  - { id: 153a5bdf-6759-4d0e-80d9-20b0c691084e, version: n2:365059b56a0b1a75, title: Type data of the Halcyra HC-2 }
replaces:
  - { id: f2da60ee-8e39-48c4-b4b4-88203190608c, version: n2:1a13fcb9728152f6, title: Limit indication at landing }
---

If every entry of the loading is valid, the system shall show the landing limit indication for the landing mass and the centre of gravity at landing according to the limit check rule.
