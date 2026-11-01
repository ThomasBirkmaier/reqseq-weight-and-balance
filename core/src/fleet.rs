//! Type data of the invented aircraft and the fleet data file.
//! Source: the type data decisions of the ReqSeq workspace (spec/decision) and data/fleet.csv.
//! Invented aircraft. Not for flight operations.
//! Masses in kg, lever arms in mm aft of the datum (1.300 m forward of the firewall).

pub struct Station {
    pub key: &'static str,
    pub name: &'static str,
    pub arm_mm: i64,
    pub max_kg: i64,
}

pub struct AircraftType {
    pub key: &'static str,
    pub name: &'static str,
    pub mtom_kg: i64,
    pub stations: &'static [Station],
    /// Envelope corners (total mass kg, centre of gravity mm), in order, convex.
    pub envelope: &'static [(i64, i64)],
}

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

#[derive(Clone, Debug, PartialEq)]
pub struct Aircraft {
    pub id: String,
    pub type_index: usize,
    pub empty_kg: i64,
    pub empty_arm_mm: i64,
    pub weighing_date: String,
}

pub fn type_index(key: &str) -> Option<usize> {
    TYPES.iter().position(|t| t.key == key)
}

/// Parse a fleet data file: `id,type,empty_mass_kg,empty_arm_mm,weighing_date`, `#` comments.
pub fn parse_fleet(csv: &str) -> Result<Vec<Aircraft>, String> {
    let mut out = Vec::new();
    for (n, line) in csv.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let f: Vec<&str> = line.split(',').map(str::trim).collect();
        if f.len() != 5 {
            return Err(format!("line {}: expected 5 fields", n + 1));
        }
        let type_index = type_index(f[1]).ok_or(format!("line {}: unknown type {}", n + 1, f[1]))?;
        let empty_kg = f[2].parse().map_err(|_| format!("line {}: empty mass", n + 1))?;
        let empty_arm_mm = f[3].parse().map_err(|_| format!("line {}: lever arm", n + 1))?;
        out.push(Aircraft {
            id: f[0].to_string(),
            type_index,
            empty_kg,
            empty_arm_mm,
            weighing_date: f[4].to_string(),
        });
    }
    Ok(out)
}

/// The aircraft of one build: all aircraft of the given type.
pub fn fleet_of_type(csv: &str, type_key: &str) -> Vec<Aircraft> {
    let t = type_index(type_key);
    parse_fleet(csv)
        .unwrap_or_default()
        .into_iter()
        .filter(|a| Some(a.type_index) == t)
        .collect()
}
