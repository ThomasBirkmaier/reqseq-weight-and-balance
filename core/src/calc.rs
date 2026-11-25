//! Mass and balance calculation with exact integer arithmetic.
//!
//! Decision on units and rounding: masses in g, lever arms in mm, moments in g·mm; limits compared as integer products.
//! The limit check rule is applied at take-off and at landing (after the planned fuel burn).

use crate::fleet::{Aircraft, AircraftType, TYPES};
use crate::fuel::FuelType;

/// Indication: the loading is within the limits.
pub const WITHIN: &str = "Within limits";
/// Indication: the total mass is above the maximum take-off mass.
pub const OUT_MASS: &str = "Outside limits: total mass above maximum take-off mass";
/// Indication: the total mass is below the lowest mass of the envelope.
pub const OUT_BELOW: &str = "Outside limits: total mass below the envelope";
/// Indication: the centre of gravity is outside the envelope.
pub const OUT_CG: &str = "Outside limits: centre of gravity outside envelope";
/// Indication: an entry is missing or invalid, so the check is not complete.
pub const INCOMPLETE: &str = "Check not complete: fill in or correct the marked entries";
/// Name of the row of the usable fuel at take-off.
pub const FUEL_ROW: &str = "Usable fuel";
/// Name of the row of the usable fuel at landing.
pub const FUEL_LANDING_ROW: &str = "Usable fuel at landing";

/// Position of the centre of gravity relative to the envelope.
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum CgState {
    /// Within the forward and aft limit.
    Within,
    /// Forward of the forward limit.
    Forward,
    /// Aft of the aft limit.
    Aft,
}

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

/// The result of the limit check rule for one state of the flight (take-off or landing).
#[derive(Debug, PartialEq, Eq, Clone)]
pub struct State {
    /// Total mass in g.
    pub total_g: i64,
    /// Total moment in g·mm.
    pub moment_gmm: i64,
    /// True when the total mass is above the maximum take-off mass.
    pub mass_exceeded: bool,
    /// True when the total mass is below the lowest mass of the envelope.
    pub mass_below: bool,
    /// Position of the centre of gravity relative to the envelope.
    pub cg_state: CgState,
    /// Forward and aft limit at the evaluated mass, as fractions (num, den) in mm.
    pub fwd_limit: (i128, i128),
    /// Aft limit at the evaluated mass, as a fraction (num, den) in mm.
    pub aft_limit: (i128, i128),
    /// The indications shown to the pilot.
    pub indications: Vec<&'static str>,
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

/// Round a/b half away from zero (b > 0).
#[must_use]
pub const fn round_div(a: i128, b: i128) -> i128 {
    if a >= 0 { (2 * a + b) / (2 * b) } else { -((-2 * a + b) / (2 * b)) }
}

/// An i128 result that is known to fit in i64 (a quotient of i64 values), saturated otherwise.
fn narrow(v: i128) -> i64 {
    i64::try_from(v).unwrap_or(if v < 0 { i64::MIN } else { i64::MAX })
}

/// Parse one entry: a whole number from 0 to max; empty is None without message.
#[must_use]
pub fn parse_entry(text: &str, max: i64, unit: &str) -> Entry {
    let t = text.trim();
    if t.is_empty() {
        return Entry { value: None, message: None };
    }
    let message = Some(format!("Enter 0 to {max} {unit}"));
    if !t.bytes().all(|b| b.is_ascii_digit()) || t.len() > 6 {
        return Entry { value: None, message };
    }
    let v: i64 = t.parse().unwrap_or(i64::MAX);
    if v > max {
        return Entry { value: None, message };
    }
    Entry { value: Some(v), message: None }
}

/// Forward and aft limit (exact fractions in mm) of the envelope at mass m in g (clamped to the envelope).
///
/// An envelope without corners (not in the type data) gives the limits 0/1 mm, so that every
/// centre of gravity is outside.
#[must_use]
pub fn limits_at(t: &AircraftType, m_g: i64) -> ((i128, i128), (i128, i128)) {
    let masses = t.envelope.iter().map(|p| i128::from(p.0) * 1000);
    let (Some(lo), Some(hi)) = (masses.clone().min(), masses.max()) else { return ((0, 1), (0, 1)) };
    let mc = i128::from(m_g).clamp(lo, hi);
    let next = t.envelope.iter().cycle().skip(1);
    let mut vals = t.envelope.iter().zip(next).filter_map(|(&a, &b)| {
        let ((m1, c1), (m2, c2)) = if a.0 <= b.0 { (a, b) } else { (b, a) };
        let (m1, m2) = (i128::from(m1) * 1000, i128::from(m2) * 1000);
        if m1 == m2 || mc < m1 || mc > m2 {
            return None;
        }
        let dm = m2 - m1;
        Some((i128::from(c1) * dm + i128::from(c2 - c1) * (mc - m1), dm))
    });
    let less = |x: &(i128, i128), y: &(i128, i128)| x.0 * y.1 < y.0 * x.1;
    let Some(first) = vals.next() else { return ((0, 1), (0, 1)) };
    let (mut fwd, mut aft) = (first, first);
    for v in vals {
        if less(&v, &fwd) {
            fwd = v;
        }
        if less(&aft, &v) {
            aft = v;
        }
    }
    (fwd, aft)
}

/// The limit check rule for one state of the flight.
fn check(t: &AircraftType, total_g: i64, moment_gmm: i64, complete: bool) -> State {
    let (fwd, aft) = limits_at(t, total_g);
    let (mo, m) = (i128::from(moment_gmm), i128::from(total_g));
    let cg_state = if m == 0 {
        CgState::Within
    } else if mo * fwd.1 < fwd.0 * m {
        CgState::Forward
    } else if mo * aft.1 > aft.0 * m {
        CgState::Aft
    } else {
        CgState::Within
    };
    let mass_exceeded = total_g > t.mtom_kg * 1000;
    let mass_below = t.envelope.iter().map(|p| p.0).min().is_some_and(|lo| i128::from(total_g) < i128::from(lo) * 1000);
    let mut indications = Vec::new();
    if complete {
        if mass_exceeded {
            indications.push(OUT_MASS);
        }
        if mass_below {
            indications.push(OUT_BELOW);
        }
        if cg_state != CgState::Within {
            indications.push(OUT_CG);
        }
        if indications.is_empty() {
            indications.push(WITHIN);
        }
    } else {
        indications.push(INCOMPLETE);
    }
    State { total_g, moment_gmm, mass_exceeded, mass_below, cg_state, fwd_limit: fwd, aft_limit: aft, indications }
}

/// Evaluate a loading: one text per loading station (kg), the usable fuel at take-off (L) and the
/// planned fuel burn (L).
///
/// An aircraft whose type index is not in the type data has no loading stations and an empty
/// envelope, so its loading is outside the limits.
#[must_use]
pub fn evaluate(aircraft: &Aircraft, fuel: &FuelType, density_g_per_l: i64, texts: &[&str], fuel_text: &str, burn_text: &str) -> Evaluation {
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
        rows.push(Row { name: s.name.into(), litres: None, g, arm_mm: s.arm_mm, moment_gmm: g * s.arm_mm });
    }
    let litres = fuel_e.value.unwrap_or(0);
    let fuel_g = litres * density_g_per_l;
    rows.push(Row { name: FUEL_ROW.into(), litres: Some(litres), g: fuel_g, arm_mm: fuel.arm_mm, moment_gmm: fuel_g * fuel.arm_mm });
    let total_g: i64 = rows.iter().map(|r| r.g).sum();
    let moment_gmm: i64 = rows.iter().map(|r| r.moment_gmm).sum();
    let burn_l = burn_e.value.unwrap_or(0).min(litres);
    let burn_g = burn_l * density_g_per_l;
    let take_off = check(t, total_g, moment_gmm, complete);
    let landing = check(t, total_g - burn_g, moment_gmm - burn_g * fuel.arm_mm, complete);
    let landing_g = fuel_g - burn_g;
    let landing_fuel = Row { name: FUEL_LANDING_ROW.into(), litres: Some(litres - burn_l), g: landing_g, arm_mm: fuel.arm_mm, moment_gmm: landing_g * fuel.arm_mm };
    Evaluation { entries, fuel: fuel_e, burn: burn_e, complete, take_off, landing, rows, landing_fuel }
}

/// Type data of an aircraft whose type index is unknown: no stations, no envelope.
const NO_TYPE: AircraftType = AircraftType { key: "", name: "", mtom_kg: 0, stations: &[], envelope: &[] };

impl State {
    /// Total mass rounded to 1 kg.
    #[must_use]
    pub fn total_kg(&self) -> i64 {
        kg_rounded(self.total_g)
    }
    /// Centre of gravity rounded to 1 mm (0.001 m).
    #[must_use]
    pub fn cg_mm_rounded(&self) -> i64 {
        if self.total_g == 0 {
            return 0;
        }
        narrow(round_div(i128::from(self.moment_gmm), i128::from(self.total_g)))
    }
    /// Centre of gravity in mm, unrounded, for drawing only.
    #[must_use]
    #[expect(
        clippy::as_conversions,
        clippy::cast_precision_loss,
        reason = "drawing value only; moments of this aircraft stay far below 2^52 g·mm"
    )]
    pub fn cg_exact_mm(&self) -> f64 {
        self.moment_gmm as f64 / self.total_g.max(1) as f64
    }
    /// True when the only indication is "Within limits".
    #[must_use]
    pub fn within(&self) -> bool {
        self.indications == [WITHIN]
    }
}

/// Mass in g rounded to 1 kg.
#[must_use]
pub fn kg_rounded(g: i64) -> i64 {
    narrow(round_div(i128::from(g), 1000))
}

/// Moment in g·mm rounded to tenths of kg·m.
#[must_use]
pub fn moment_tenths(gmm: i64) -> i64 {
    narrow(round_div(i128::from(gmm), 100_000))
}
