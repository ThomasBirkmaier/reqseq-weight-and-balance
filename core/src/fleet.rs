//! Type data and fleet of the invented aircraft. Source: the type data decisions of the
//! ReqSeq workspace (spec/decision). Invented aircraft. Not for flight operations.
//! Masses in kg, lever arms in mm aft of the datum (front face of the firewall).

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

pub struct Aircraft {
    pub id: &'static str,
    pub type_index: usize,
    pub empty_kg: i64,
    pub empty_arm_mm: i64,
}

pub const TYPES: &[AircraftType] = &[
    AircraftType {
        key: "hc4",
        name: "Halcyra HC-4",
        mtom_kg: 1150,
        stations: &[
            Station { key: "front", name: "Front seats", arm_mm: 2300, max_kg: 230 },
            Station { key: "rear", name: "Rear seats", arm_mm: 3250, max_kg: 200 },
            Station { key: "baggage", name: "Baggage compartment", arm_mm: 3950, max_kg: 50 },
        ],
        envelope: &[(650, 2100), (900, 2100), (1150, 2220), (1150, 2470), (650, 2470)],
    },
    AircraftType {
        key: "hc2",
        name: "Halcyra HC-2",
        mtom_kg: 920,
        stations: &[
            Station { key: "front", name: "Front seats", arm_mm: 2250, max_kg: 220 },
            Station { key: "baggage", name: "Baggage compartment", arm_mm: 2900, max_kg: 40 },
        ],
        envelope: &[(550, 2050), (750, 2050), (920, 2140), (920, 2190), (550, 2190)],
    },
];

pub const FLEET: &[Aircraft] = &[
    Aircraft { id: "HC4-01", type_index: 0, empty_kg: 765, empty_arm_mm: 2220 },
    Aircraft { id: "HC4-02", type_index: 0, empty_kg: 778, empty_arm_mm: 2236 },
    Aircraft { id: "HC2-01", type_index: 1, empty_kg: 640, empty_arm_mm: 2150 },
];
