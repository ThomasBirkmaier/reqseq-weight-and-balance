---
id: 329aa8b7-a057-45ea-9d76-f1aa765ca0ef
type: system-requirement
status: draft
title: Mass entry per loading station in the HC-2 build
rationale: "The pilot enters what is on board per place where it is loaded; showing the maximum helps to enter a valid mass. Safety-related: it is the only requirement that every loading station of the aircraft type has a mass entry. A loading station without an entry would leave its mass out of the total mass and the centre of gravity, and the limit indication could show \"Within limits\" for a loading in which an entry is missing. HC-2 replacement of SR-e95f42: the statement of SR-e95f42 with acceptance criteria from the type data of the Halcyra HC-2, because ReqSeq has no validity per acceptance criterion (scope of release 3)."
requirement-type: functional
acceptance-criteria:
  - key: y112
    text: Given the aircraft HC2-01 is selected in the HC-2 build, when the app is shown, then it shows the empty entries "Front seats (max 220 kg)" and "Baggage compartment (max 40 kg)" and no rear seats entry.
  - key: mff8
    text: Given the aircraft HC2-01 is selected in the HC-2 build with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 160 kg front seats and 0 kg baggage compartment, then the entry "Front seats" shows 160 and the total mass shows 800 kg.
validity:
  - { id: 05ae9286-bea0-45ad-9338-d1f959f23826, version: n2:22b0303ec030d854, title: Halcyra HC-2 }
packages:
  - { id: 6dfd18aa-ad50-4c68-9c54-1bb4df983f84, version: n2:22b0303ec030d854, title: Variant Halcyra HC-2 }
verification-method: test
criticality: high
safety-related: "yes"
derives-from:
  - { id: 26a81038-3f7b-4df9-bfcb-e94f646010df, version: n2:393742df396347e0, title: Enter what is on board }
based-on:
  - { id: d9378504-282e-4688-918c-d6c354e582bf, version: n2:f623091fdc76332a, title: "Units, input resolution and rounding" }
  - { id: 8af32ef6-642a-4c83-9c76-b554fd14600e, version: n2:5d6477e724aa36ba, title: Type data of the Halcyra HC-4 }
  - { id: 153a5bdf-6759-4d0e-80d9-20b0c691084e, version: n2:365059b56a0b1a75, title: Type data of the Halcyra HC-2 }
replaces:
  - { id: 06510c41-64db-41cf-a63a-f8bb1ee95f42, version: n2:0c23df8fb156db80, title: Mass entry per loading station }
mitigates:
  - { id: 48d41b74-74f0-43aa-8b0e-0546f7447f9b, version: n2:989c64a11f8228b2, title: "Invalid, missing or wrong data used for a limit indication" }
---

If an aircraft is selected, the system shall provide one mass entry in kg for each loading station of its aircraft type other than the usable fuel, labelled with the name of the loading station and its maximum mass.
