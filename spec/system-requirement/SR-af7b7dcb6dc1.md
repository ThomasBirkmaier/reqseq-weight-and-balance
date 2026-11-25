---
id: cb28ff25-e06f-40bb-8ae4-af7b7dcb6dc1
type: system-requirement
status: draft
title: Label of a loading point outside the limits
rationale: "The pilot sees which limit (forward, aft or mass) is exceeded. Split in release 3 from the envelope chart, whose criteria named the labels. Not safety-related: the limit indication states the exceeded limit; the label repeats it in the chart."
requirement-type: functional
acceptance-criteria:
  - key: jvj0
    text: Given the aircraft HC4-01 is selected with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 70 kg front seats, 200 kg rear seats and 50 kg baggage compartment, then the chart shows the take-off point at (1085 kg, 2.475 m) aft of the aft limit with the label "Aft limit exceeded".
  - key: wv1w
    text: Given the aircraft HC4-01 is selected with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 200 kg front seats, 0 kg rear seats and 0 kg baggage compartment, then the chart shows the take-off point at (965 kg, 2.174 m) forward of the forward limit with the label "Forward limit exceeded".
  - key: g90h
    text: Given the aircraft HC4-01 is selected with 0 L usable fuel at take-off and 0 L planned fuel burn, when the pilot enters 180 kg front seats, 160 kg rear seats and 50 kg baggage compartment, then the chart shows the take-off point at (1155 kg, 2.403 m) above the maximum take-off mass with the label "Mass limit exceeded".
packages:
  - { id: 7ca2dae5-b8a7-44de-a6c7-9542ff2e84f3, version: n2:22b0303ec030d854, title: Loading and display }
verification-method: test
criticality: medium
safety-related: "no"
derives-from:
  - { id: 465f8f9c-92dd-40c9-871b-b316a598a54d, version: n2:4005d952761e460c, title: See where the load acts }
  - { id: 78a8cd99-84e8-41f7-9239-2ed99f790a55, version: n2:c9600efe15d7249e, title: Know at once whether the centre of gravity is permitted }
  - { id: 1e298834-92c8-438a-8296-9786b6e9c5c6, version: n2:0cc7ab4f62981fdc, title: Know at once whether the mass is permitted }
based-on:
  - { id: 8af32ef6-642a-4c83-9c76-b554fd14600e, version: n2:5d6477e724aa36ba, title: Type data of the Halcyra HC-4 }
  - { id: a016275b-69c9-4bbe-bf70-4ee6afa30083, version: n2:f2651947f0abaedb, title: Limit check rule }
---

If the take-off point of a valid loading lies outside the limits, the system shall show next to that point in the envelope chart the label of the exceeded limit, the label of a centre of gravity limit taking precedence over "Mass limit exceeded".
