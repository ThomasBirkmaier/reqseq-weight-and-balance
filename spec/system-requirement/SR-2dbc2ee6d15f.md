---
id: 85f5bb83-db62-48ef-a730-2dbc2ee6d15f
type: system-requirement
status: draft
title: Aircraft selection without preselection in the HC-2 build
rationale: "A preselected aircraft could give a result for an aircraft the pilot did not choose. Split in release 3 from the requirement on the selected aircraft, whose criteria named the selection. HC-2 replacement of SR-1e4aee: the statement of SR-1e4aee with acceptance criteria from the type data of the Halcyra HC-2, because ReqSeq has no validity per acceptance criterion (scope of release 3)."
requirement-type: functional
acceptance-criteria:
  - key: q7ty
    text: Given the HC-2 build is open, when the pilot opens the aircraft selection, then it lists HC2-01 only.
  - key: p3yv
    text: Given the HC-2 build is opened, when no aircraft has been selected yet, then no aircraft is preselected, no mass entry and no result is shown, and the app shows "Select the aircraft".
validity:
  - { id: 05ae9286-bea0-45ad-9338-d1f959f23826, version: n2:22b0303ec030d854, title: Halcyra HC-2 }
packages:
  - { id: 6dfd18aa-ad50-4c68-9c54-1bb4df983f84, version: n2:22b0303ec030d854, title: Variant Halcyra HC-2 }
verification-method: test
criticality: high
safety-related: "yes"
mitigates:
  - { id: 48d41b74-74f0-43aa-8b0e-0546f7447f9b, version: n2:989c64a11f8228b2, title: "Invalid, missing or wrong data used for a limit indication" }
derives-from:
  - { id: fd4c0543-9439-46c0-8519-d50f6fe67c17, version: n2:32640abb0f932a24, title: Right data for the individual aircraft }
based-on:
  - { id: 8af32ef6-642a-4c83-9c76-b554fd14600e, version: n2:5d6477e724aa36ba, title: Type data of the Halcyra HC-4 }
  - { id: 153a5bdf-6759-4d0e-80d9-20b0c691084e, version: n2:365059b56a0b1a75, title: Type data of the Halcyra HC-2 }
replaces:
  - { id: 50deee18-257e-4967-bdf6-5b45381e4aee, version: n2:7daa1e629f8d7276, title: Aircraft selection without preselection }
---

If the app is opened, the system shall offer the aircraft of its build from the fleet data file for selection without a preselected aircraft.
