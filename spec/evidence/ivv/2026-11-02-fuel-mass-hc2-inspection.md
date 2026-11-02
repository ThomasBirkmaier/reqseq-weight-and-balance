# IV&V inspection: fuel mass in the fuel interface data file, HC-2 view

Inspected file: `data/fuel-module.json` at fb308e5, interface version 1.0.1, aircraft HC2-01 (HC-2 build).

| Field | Value in the file | Recomputed | Agrees |
| --- | --- | --- | --- |
| `aircraft.HC2-01.usableFuelL` | 78 | – | – |
| `fuelDensityKgPerL` | 0.72 | – | – |
| `aircraft.HC2-01.fuelMassKg` | 56.2 | 78 × 0.72 = 56.16, rounded half up to 0.1 kg = 56.2 | yes |

The HC-2 build reads the same file; the app computes its own fuel mass in grams (78 × 720 g = 56 160 g) and shows 56 kg, within the display rounding of 1 kg. Result: passed.
