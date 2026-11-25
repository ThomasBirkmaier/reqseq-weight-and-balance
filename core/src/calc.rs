//! Evaluation of one loading: the entries, the rows of the loading table and the limit check at
//! take-off and at landing (after the planned fuel burn).
//!
//! Decision on units and rounding: masses in g, lever arms in mm, moments in g·mm; the limit
//! check rule itself is in [`crate::limits`].

use crate::fleet::{Aircraft, AircraftType, TYPES};
use crate::fuel::FuelType;
use crate::limits::check;
pub use crate::limits::{
    CgState, INCOMPLETE, OUT_BELOW, OUT_CG, OUT_MASS, State, WITHIN, kg_rounded, limits_at, moment_tenths, round_div,
};

/// Name of the row of the usable fuel at take-off.
pub const FUEL_ROW: &str = "Usable fuel";
/// Name of the row of the usable fuel at landing.
pub const FUEL_LANDING_ROW: &str = "Usable fuel at landing";

/// One parsed entry of the pilot.
#[derive(Debug, PartialEq, Eq, Clone)]
pub struct Entry {
    /// Value (kg for a mass, L for fuel) when the entry is valid.
    pub value: Option<i64>,
    /// Message next to the entry when it is invalid; None for a valid or an empty entry.
    pub message: Option<String>,
}

/// One row of the loading table.
#[derive(Debug, PartialEq, Eq, Clone)]
pub struct Row {
    /// Name of the row (empty mass, a loading station or the usable fuel).
    pub name: String,
    /// Litres for the fuel row, None for the others.
    pub litres: Option<i64>,
    /// Mass in g.
    pub g: i64,
    /// Lever arm in mm aft of the datum.
    pub arm_mm: i64,
    /// Moment in g·mm.
    pub moment_gmm: i64,
}

/// The evaluation of one loading.
#[derive(Debug, PartialEq, Eq, Clone)]
pub struct Evaluation {
    /// Mass entries, one per loading station of the type.
    pub entries: Vec<Entry>,
    /// Entry of the usable fuel at take-off (L).
    pub fuel: Entry,
    /// Entry of the planned fuel burn (L).
    pub burn: Entry,
    /// True when every entry is valid.
    pub complete: bool,
    /// Limit check at take-off.
    pub take_off: State,
    /// Limit check at landing (after the planned fuel burn).
    pub landing: State,
    /// Empty mass, loading stations and usable fuel at take-off.
    pub rows: Vec<Row>,
    /// Usable fuel at landing: the usable fuel at take-off minus the planned fuel burn.
    pub landing_fuel: Row,
}

/// Parse one entry: a whole number from 0 to max; empty is None without message.
#[must_use]
pub fn parse_entry(text: &str, max: i64, unit: &str) -> Entry {
    let t = text.trim();
    if t.is_empty() {
        return Entry {
            value: None,
            message: None,
        };
    }
    let message = Some(format!("Enter 0 to {max} {unit}"));
    if !t.bytes().all(|b| b.is_ascii_digit()) || t.len() > 6 {
        return Entry { value: None, message };
    }
    let v: i64 = t.parse().unwrap_or(i64::MAX);
    if v > max {
        return Entry { value: None, message };
    }
    Entry {
        value: Some(v),
        message: None,
    }
}

/// Evaluate a loading: one text per loading station (kg), the usable fuel at take-off (L) and the
/// planned fuel burn (L).
///
/// An aircraft whose type index is not in the type data has no loading stations and an empty
/// envelope, so its loading is outside the limits.
#[must_use]
pub fn evaluate(
    aircraft: &Aircraft,
    fuel: &FuelType,
    density_g_per_l: i64,
    texts: &[&str],
    fuel_text: &str,
    burn_text: &str,
) -> Evaluation {
    let t = TYPES.get(aircraft.type_index).unwrap_or(&NO_TYPE);
    let entries: Vec<Entry> = t
        .stations
        .iter()
        .enumerate()
        .map(|(i, s)| parse_entry(texts.get(i).copied().unwrap_or(""), s.max_kg, "kg"))
        .collect();
    let fuel_e = parse_entry(fuel_text, fuel.capacity_l, "L");
    let burn_e = parse_entry(burn_text, fuel_e.value.unwrap_or(fuel.capacity_l), "L");
    let complete = entries.iter().all(|e| e.value.is_some()) && fuel_e.value.is_some() && burn_e.value.is_some();
    let mut rows = vec![Row {
        name: "Empty mass".into(),
        litres: None,
        g: aircraft.empty_kg * 1000,
        arm_mm: aircraft.empty_arm_mm,
        moment_gmm: aircraft.empty_kg * 1000 * aircraft.empty_arm_mm,
    }];
    for (s, e) in t.stations.iter().zip(&entries) {
        let g = e.value.unwrap_or(0) * 1000;
        rows.push(Row {
            name: s.name.into(),
            litres: None,
            g,
            arm_mm: s.arm_mm,
            moment_gmm: g * s.arm_mm,
        });
    }
    let litres = fuel_e.value.unwrap_or(0);
    let fuel_g = litres * density_g_per_l;
    rows.push(Row {
        name: FUEL_ROW.into(),
        litres: Some(litres),
        g: fuel_g,
        arm_mm: fuel.arm_mm,
        moment_gmm: fuel_g * fuel.arm_mm,
    });
    let total_g: i64 = rows.iter().map(|r| r.g).sum();
    let moment_gmm: i64 = rows.iter().map(|r| r.moment_gmm).sum();
    let burn_l = burn_e.value.unwrap_or(0).min(litres);
    let burn_g = burn_l * density_g_per_l;
    let take_off = check(t, total_g, moment_gmm, complete);
    let landing = check(t, total_g - burn_g, moment_gmm - burn_g * fuel.arm_mm, complete);
    let landing_g = fuel_g - burn_g;
    let landing_fuel = Row {
        name: FUEL_LANDING_ROW.into(),
        litres: Some(litres - burn_l),
        g: landing_g,
        arm_mm: fuel.arm_mm,
        moment_gmm: landing_g * fuel.arm_mm,
    };
    Evaluation {
        entries,
        fuel: fuel_e,
        burn: burn_e,
        complete,
        take_off,
        landing,
        rows,
        landing_fuel,
    }
}

/// Type data of an aircraft whose type index is unknown: no stations, no envelope.
const NO_TYPE: AircraftType = AircraftType {
    key: "",
    name: "",
    mtom_kg: 0,
    stations: &[],
    envelope: &[],
};
