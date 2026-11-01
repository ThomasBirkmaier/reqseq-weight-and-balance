---
id: 3f61ba4d-c324-4724-9e28-c8cbad070ac3
type: system-requirement
status: draft
title: Readable in light and dark mode
rationale: The check is done in daylight and in a dim hangar; 4.5:1 is the common minimum for readable text.
requirement-type: quality
acceptance-criteria:
  - Given the device is set to light mode, when the app is open with a valid loading, then the contrast ratio of the limit indication and of the body text against their background is at least 4.5:1.
  - Given the device is set to dark mode, when the app is open with a valid loading, then the contrast ratio of the limit indication and of the body text against their background is at least 4.5:1.
  - Given the device is set to light mode or to dark mode, when the chart and the top view are shown, then the envelope line, the loading point and the loading station marks have a contrast ratio of at least 3:1 against their background.
packages:
  - { id: b15a20a7-4f64-4872-9b9d-0d6c8d7e7b67, version: n1:67ebd0624004c969, title: Platform and quality }
verification-method: test
criticality: medium
safety-related: "no"
derives-from:
  - { id: a6a364fe-92f9-4f63-a634-8233bde01992, version: n1:672f0e5cfae1911b, title: Use it at the aircraft on a phone }
---

If the device is set to light mode or to dark mode, the system shall show every text with a contrast ratio of at least 4.5:1 against its background.
