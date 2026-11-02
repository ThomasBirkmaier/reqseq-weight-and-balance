---
id: 8782d1ab-a0a4-4198-92b5-b5fe95c1fe36
type: system-requirement
status: draft
title: Result and edited entry in view on a phone
rationale: The pilot sees the result at once after the last entry without scrolling, and the message of a wrong entry stays readable (split from the requirement on use on a phone screen).
requirement-type: quality
acceptance-criteria:
  - Given a viewport of 360 px × 740 px and the aircraft HC4-01 selected, when the pilot has entered the planned fuel burn, then the take-off limit indication is inside the viewport without vertical scrolling.
  - Given a viewport of 360 px × 740 px and the aircraft HC4-01 selected, when the pilot enters 160 kg front seats, 75 kg rear seats and 60 kg baggage compartment, then the baggage compartment entry and its message "Enter 0 to 50 kg" are inside the viewport and not covered by the result.
packages:
  - { id: b15a20a7-4f64-4872-9b9d-0d6c8d7e7b67, version: n1:67ebd0624004c969, title: Platform and quality }
verification-method: test
criticality: medium
safety-related: "no"
derives-from:
  - { id: a6a364fe-92f9-4f63-a634-8233bde01992, version: n1:1b7623255b6ceebb, title: Use it at the aircraft on a phone }
  - { id: 1e298834-92c8-438a-8296-9786b6e9c5c6, version: n1:574c5c59f92846ee, title: Know at once whether the mass is permitted }
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n1:997da7ed8d9f3ec8, title: Know at once whether the centre of gravity is permitted }
---

If the app is shown in a viewport of 360 px × 740 px, the system shall keep the take-off limit indication and the entry being edited inside the viewport without vertical scrolling.
