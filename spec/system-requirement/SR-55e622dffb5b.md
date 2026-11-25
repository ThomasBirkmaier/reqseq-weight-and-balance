---
id: 478b57b5-2100-4051-9d7f-55e622dffb5b
type: system-requirement
status: draft
title: Responsibility statement
rationale: The pilot in command stays responsible for mass and balance (client remark M-3). Split in release 3 from the requirement on the fixed notices.
requirement-type: functional
acceptance-criteria:
  - key: pdxp
    text: Given the app of either build is open with an aircraft selected, when the page is shown, then the statement "This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual." is shown above the first result.
packages:
  - { id: b15a20a7-4f64-4872-9b9d-0d6c8d7e7b67, version: n2:22b0303ec030d854, title: Platform and quality }
verification-method: test
criticality: high
safety-related: "no"
originates-from:
  - { id: 2f23eb42-057f-44ec-88cd-10a960b70292, version: n2:3b5d2ed04bb7dd58, title: Scope of release 2 }
based-on:
  - { id: 56927378-bfa8-4bfb-91c0-7792b31af77a, version: n2:e18fab6a3a571239, title: Decisions as origin of requirements }
---

If the app is open, the system shall show the statement "This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual." above the first result.
