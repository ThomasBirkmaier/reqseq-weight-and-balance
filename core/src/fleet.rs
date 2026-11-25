//! Type data of the invented aircraft and the fleet data file.
//!
//! Source: the type data decisions of the ReqSeq workspace (`spec/decision`) and `data/fleet.csv`.
//! Invented aircraft. Not for flight operations.
//! Masses in kg, lever arms in mm aft of the datum (1.300 m forward of the firewall).

/// A loading station of an aircraft type.
#[derive(Debug)]
pub struct Station {
    /// Key of the station in the web app.
    pub key: &'static str,
    /// Name shown to the pilot.
    pub name: &'static str,
    /// Lever arm in mm aft of the datum.
    pub arm_mm: i64,
    /// Maximum mass of the station in kg.
    pub max_kg: i64,
}

/// The type data of an aircraft type.
#[derive(Debug)]
pub struct AircraftType {
    /// Type key of the build (hc4, hc2).
    pub key: &'static str,
    /// Type name shown to the pilot.
    pub name: &'static str,
    /// Maximum take-off mass in kg.
    pub mtom_kg: i64,
    /// The loading stations, in the order of the entries.
    pub stations: &'static [Station],
    /// Envelope corners (total mass kg, centre of gravity mm), in order, convex.
    pub envelope: &'static [(i64, i64)],
}

/// The aircraft types of the type data decisions.
pub const TYPES: &[AircraftType] = &[
    AircraftType {
        key: "hc4",
        name: "Halcyra HC-4",
        mtom_kg: 1150,
        stations: &[
            Station { key: "front", name: "Front seats", arm_mm: 2000, max_kg: 230 },
            Station { key: "rear", name: "Rear seats", arm_mm: 3250, max_kg: 200 },
            Station { key: "baggage", name: "Baggage compartment", arm_mm: 3950, max_kg: 50 },
        ],
        envelope: &[(650, 2100), (850, 2100), (1150, 2300), (1150, 2470), (650, 2470)],
    },
    AircraftType {
        key: "hc2",
        name: "Halcyra HC-2",
        mtom_kg: 880,
        stations: &[
            Station { key: "front", name: "Front seats", arm_mm: 2000, max_kg: 220 },
            Station { key: "baggage", name: "Baggage compartment", arm_mm: 2900, max_kg: 40 },
        ],
        envelope: &[(550, 2050), (750, 2050), (880, 2130), (880, 2170), (550, 2170)],
    },
];

/// The fleet data file compiled into the build.
pub const FLEET_CSV: &str = include_str!("../../data/fleet.csv");

/// One aircraft of the fleet data file.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Aircraft {
    /// Invented identifier of the aircraft (not a registration).
    pub id: String,
    /// Index of its type in [`TYPES`].
    pub type_index: usize,
    /// Empty mass in kg.
    pub empty_kg: i64,
    /// Lever arm of the empty mass in mm aft of the datum.
    pub empty_arm_mm: i64,
    /// Date of the last weighing (YYYY-MM-DD).
    pub weighing_date: String,
}

/// Index in [`TYPES`] of the type with the given key.
#[must_use]
pub fn type_index(key: &str) -> Option<usize> {
    TYPES.iter().position(|t| t.key == key)
}

/// Parse a fleet data file: `id,type,empty_mass_kg,empty_arm_mm,weighing_date`, `#` comments.
///
/// # Errors
/// The line number and the field of the first line that does not have five fields, names an
/// unknown type or has an empty mass or lever arm that is not a whole number.
pub fn parse_fleet(csv: &str) -> Result<Vec<Aircraft>, String> {
    let mut out = Vec::new();
    for (n, raw) in (1_usize..).zip(csv.lines()) {
        let line = raw.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let f: Vec<&str> = line.split(',').map(str::trim).collect();
        let [id, type_key, empty_kg, empty_arm_mm, weighing_date] = f.as_slice() else {
            return Err(format!("line {n}: expected 5 fields"));
        };
        let type_index = type_index(type_key).ok_or_else(|| format!("line {n}: unknown type {type_key}"))?;
        let empty_kg = empty_kg.parse().map_err(|_| format!("line {n}: empty mass"))?;
        let empty_arm_mm = empty_arm_mm.parse().map_err(|_| format!("line {n}: lever arm"))?;
        out.push(Aircraft {
            id: (*id).to_owned(),
            type_index,
            empty_kg,
            empty_arm_mm,
            weighing_date: (*weighing_date).to_owned(),
        });
    }
    Ok(out)
}

/// The aircraft of one build: all aircraft of the given type.
#[must_use]
pub fn fleet_of_type(csv: &str, type_key: &str) -> Vec<Aircraft> {
    let t = type_index(type_key);
    parse_fleet(csv)
        .unwrap_or_default()
        .into_iter()
        .filter(|a| Some(a.type_index) == t)
        .collect()
}
