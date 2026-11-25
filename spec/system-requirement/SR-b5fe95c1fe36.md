---
id: 8782d1ab-a0a4-4198-92b5-b5fe95c1fe36
type: system-requirement
status: draft
title: Limit indications in view on a phone
rationale: The pilot sees the result at once after the last entry without scrolling (split from the requirement on use on a phone screen). Split in release 3 from the edited entry that the result must not cover.
requirement-type: quality
acceptance-criteria:
  - key: pf8z
    text: Given a viewport of 360 px × 740 px and an aircraft of the build selected, when the pilot has entered a valid loading with the planned fuel burn as the last entry, then the take-off and the landing limit indication are inside the viewport without vertical scrolling.
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

If the app is shown in a viewport of 360 px × 740 px, the system shall show the take-off and the landing limit indication inside the viewport without vertical scrolling after the last entry of the loading.
