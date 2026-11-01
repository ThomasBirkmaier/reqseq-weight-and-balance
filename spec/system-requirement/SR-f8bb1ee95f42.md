---
id: 06510c41-64db-41cf-a63a-f8bb1ee95f42
type: system-requirement
status: draft
title: Mass entry per loading station
rationale: The pilot enters what is on board per place where it is loaded; showing the maximum helps to enter a valid mass.
requirement-type: functional
acceptance-criteria:
  - Given the aircraft HC4-01 is selected, when the app is shown, then it shows the empty entries "Front seats (max 230 kg)", "Rear seats (max 200 kg)" and "Baggage compartment (max 50 kg)".
  - Given the aircraft HC4-01 is selected, when the pilot enters 160 kg front seats, 0 kg rear seats and 0 kg baggage compartment, then the entry "Front seats" shows 160 and the total mass shows 925 kg.
packages:
  - { id: 7ca2dae5-b8a7-44de-a6c7-9542ff2e84f3, version: n1:67ebd0624004c969, title: Loading and display }
verification-method: test
criticality: high
safety-related: "no"
derives-from:
  - { id: 26a81038-3f7b-4df9-bfcb-e94f646010df, version: n1:b10ab801eb9fafcb, title: Enter what is on board }
based-on:
  - { id: d9378504-282e-4688-918c-d6c354e582bf, version: n1:b671cab842587e57, title: "Units, input resolution and rounding" }
---

If an aircraft is selected, the system shall provide one mass entry in kg for each loading station of its aircraft type, labelled with the name of the loading station and its maximum mass.
