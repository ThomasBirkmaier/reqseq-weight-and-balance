//! The fuel interface data file of the supplier's fuel system module (`data/fuel-module.json`).
//!
//! Content: fuel density, per aircraft type the fuel lever arm and usable capacity, per aircraft the last
//! reported usable fuel. Read with a minimal JSON reader (no external crates). Decimal values are
//! read as exact integers: density in g/L, lever arm in mm.

use crate::json::{Json, parse_json};
use std::collections::BTreeMap;

/// The fuel interface data file compiled into the build.
pub const FUEL_JSON: &str = include_str!("../../data/fuel-module.json");

/// A decimal number text as an exact integer in units of 10^-scale ("2.35", 3 → 2350).
///
/// # Errors
/// When the text is not a non-negative decimal with at most `scale` places, or does not fit in i64.
pub fn decimal_scaled(t: &str, scale: u32) -> Result<i64, String> {
    let (int, frac) = t.split_once('.').unwrap_or((t, ""));
    let width = usize::try_from(scale).map_err(|e| e.to_string())?;
    if int.is_empty()
        || !int.bytes().all(|b| b.is_ascii_digit())
        || !frac.bytes().all(|b| b.is_ascii_digit())
        || frac.len() > width
    {
        return Err(format!("not a decimal with at most {scale} places: {t}"));
    }
    let f = format!("{frac:0<width$}");
    let whole = int.parse::<i64>().map_err(|e| e.to_string())?;
    let part = if f.is_empty() {
        0
    } else {
        f.parse::<i64>().map_err(|e| e.to_string())?
    };
    10_i64
        .checked_pow(scale)
        .and_then(|unit| whole.checked_mul(unit))
        .and_then(|v| v.checked_add(part))
        .ok_or_else(|| format!("decimal out of range: {t}"))
}

/// The fuel data of one aircraft type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FuelType {
    /// Fuel lever arm in mm aft of the datum.
    pub arm_mm: i64,
    /// Usable fuel capacity in whole litres.
    pub capacity_l: i64,
}

/// The last fuel report of one aircraft.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FuelReport {
    /// Usable fuel on board in whole litres.
    pub litres: i64,
    /// Report time in UTC (ISO 8601, to the second).
    pub reported_at: String,
}

/// The content of the fuel interface data file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FuelData {
    /// Version of the interface (major.minor.patch).
    pub interface_version: String,
    /// Fuel density in g/L.
    pub density_g_per_l: i64,
    /// Keyed by the type key of the build (hc4, hc2).
    pub types: BTreeMap<String, FuelType>,
    /// Keyed by aircraft id.
    pub aircraft: BTreeMap<String, FuelReport>,
}

/// The type key of the build for the type name of the interface file ("HC-4" → "hc4").
#[must_use]
pub fn type_key_of(name: &str) -> String {
    name.replace('-', "").to_lowercase()
}

/// Member `k` of the object `o`.
fn get<'a>(o: &'a Json, k: &str) -> Result<&'a Json, String> {
    if let Json::Obj(m) = o {
        m.get(k).ok_or_else(|| format!("missing field {k}"))
    } else {
        Err(format!("not an object at {k}"))
    }
}
/// Number member `k` of the object `o`, as its text.
fn num(o: &Json, k: &str) -> Result<String, String> {
    if let Json::Num(n) = get(o, k)? {
        Ok(n.clone())
    } else {
        Err(format!("{k} is not a number"))
    }
}
/// String member `k` of the object `o`.
fn text(o: &Json, k: &str) -> Result<String, String> {
    if let Json::Str(s) = get(o, k)? {
        Ok(s.clone())
    } else {
        Err(format!("{k} is not a string"))
    }
}

/// Parse the fuel interface data file.
///
/// # Errors
/// When the file is not JSON, has an unsupported interface version (major other than 1), or a
/// field is missing or not of its documented form.
pub fn parse_fuel(json: &str) -> Result<FuelData, String> {
    let root = parse_json(json)?;
    let interface_version = text(&root, "interfaceVersion")?;
    if !interface_version.starts_with("1.") {
        return Err(format!("unsupported interface version {interface_version}"));
    }
    let density_g_per_l = decimal_scaled(&num(&root, "fuelDensityKgPerL")?, 3)?;
    let mut types = BTreeMap::new();
    if let Json::Obj(m) = get(&root, "types")? {
        for (name, v) in m {
            let arm_mm = decimal_scaled(&num(v, "fuelLeverArmM")?, 3)?;
            let capacity_l = num(v, "usableCapacityL")?.parse().map_err(|_| "usableCapacityL")?;
            let key = type_key_of(name);
            if types.contains_key(&key) {
                return Err(format!("duplicate aircraft type {name}"));
            }
            _ = types.entry(key).or_insert(FuelType { arm_mm, capacity_l });
        }
    }
    let mut aircraft = BTreeMap::new();
    if let Json::Obj(m) = get(&root, "aircraft")? {
        for (id, v) in m {
            let litres = num(v, "usableFuelL")?.parse().map_err(|_| "usableFuelL")?;
            _ = aircraft.entry(id.clone()).or_insert(FuelReport {
                litres,
                reported_at: text(v, "reportedAtUtc")?,
            });
        }
    }
    Ok(FuelData {
        interface_version,
        density_g_per_l,
        types,
        aircraft,
    })
}

/// The fuel data of this build; a broken file is a build error caught by the tests.
///
/// # Errors
/// As [`parse_fuel`] for the compiled-in file.
pub fn fuel_data() -> Result<FuelData, String> {
    parse_fuel(FUEL_JSON)
}
