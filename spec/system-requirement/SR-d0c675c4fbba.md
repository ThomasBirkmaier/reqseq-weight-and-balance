---
id: f93945c8-3fc5-4e81-8f9a-d0c675c4fbba
type: system-requirement
status: approved
title: Note on the pilot's fuel figure
rationale: The pilot must see at once whether the check uses the reported or the own figure. Split in release 3 from the calculation with the pilot's figure.
requirement-type: functional
acceptance-criteria:
  - key: qvvn
    text: Given the aircraft HC4-01 is selected with the reported 142 L, when the pilot changes "Usable fuel at take-off" to 100, then the app shows "Pilot's figure (fuel system module reported 142 L)" next to the entry.
  - key: t2x6
    text: Given the note of the first criterion is shown, when the pilot changes the entry back to 142, then the note is not shown.
packages:
  - { id: 3e5eeb97-469a-41da-bb34-a3f97b6e30b5, version: n2:22b0303ec030d854, title: Fuel path }
verification-method: test
criticality: high
safety-related: "yes"
mitigates:
  - { id: c01c78a7-7920-43cc-aadb-45a5f709ad87, version: n2:844bb1e844cd58b2, title: Wrong fuel quantity or fuel data used for a limit indication }
derives-from:
  - { id: c2719292-cf52-4e48-b4c9-761dd4cac39d, version: n2:5a9c7ae27aab9964, title: See and correct the reported fuel quantity }
based-on:
  - { id: 2f23eb42-057f-44ec-88cd-10a960b70292, version: n2:3b5d2ed04bb7dd58, title: Scope of release 2 }
---

If the pilot changes the usable fuel at take-off to a figure other than the reported quantity, the system shall show the note `Pilot's figure (fuel system module reported {quantity} L)` next to the entry, with the reported quantity as `{quantity}`.
