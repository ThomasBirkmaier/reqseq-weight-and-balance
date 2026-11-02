//! Mass and balance calculation with exact integer arithmetic (decision on units and rounding):
//! masses in g, lever arms in mm, moments in g·mm; limits compared as integer products.
//! The limit check rule is applied at take-off and at landing (after the planned fuel burn).

use crate::fleet::{Aircraft, AircraftType, TYPES};
use crate::fuel::FuelType;

pub const WITHIN: &str = "Within limits";
pub const OUT_MASS: &str = "Outside limits: total mass above maximum take-off mass";
pub const OUT_CG: &str = "Outside limits: centre of gravity outside envelope";
pub const INCOMPLETE: &str = "Check not complete: fill in or correct the marked entries";
pub const FUEL_ROW: &str = "Usable fuel";
pub const FUEL_LANDING_ROW: &str = "Usable fuel at landing";

#[derive(Debug, PartialEq, Clone, Copy)]
pub enum CgState {
    Within,
    Forward,
    Aft,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Entry {
    /// Value (kg for a mass, L for fuel) when the entry is valid.
    pub value: Option<i64>,
    /// Message next to the entry when it is invalid; None for a valid or an empty entry.
    pub message: Option<String>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Row {
    pub name: String,
    /// Litres for the fuel row, None for the others.
    pub litres: Option<i64>,
    pub g: i64,
    pub arm_mm: i64,
    pub moment_gmm: i64,
}

/// The result of the limit check rule for one state of the flight (take-off or landing).
#[derive(Debug, PartialEq, Clone)]
pub struct State {
    pub total_g: i64,
    pub moment_gmm: i64,
    pub mass_exceeded: bool,
    pub cg_state: CgState,
    /// Forward and aft limit at the evaluated mass, as fractions (num, den) in mm.
    pub fwd_limit: (i128, i128),
    pub aft_limit: (i128, i128),
    pub indications: Vec<&'static str>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Evaluation {
    /// Mass entries, one per loading station of the type.
    pub entries: Vec<Entry>,
    pub fuel: Entry,
    pub burn: Entry,
    pub complete: bool,
    pub take_off: State,
    pub landing: State,
    /// Empty mass, loading stations and usable fuel at take-off.
    pub rows: Vec<Row>,
    /// Usable fuel at landing: the usable fuel at take-off minus the planned fuel burn.
    pub landing_fuel: Row,
}

/// Round a/b half away from zero (b > 0).
pub fn round_div(a: i128, b: i128) -> i128 {
    if a >= 0 {
        (2 * a + b) / (2 * b)
    } else {
        -((-2 * a + b) / (2 * b))
    }
}

/// Parse one entry: a whole number from 0 to max; empty is None without message.
pub fn parse_entry(text: &str, max: i64, unit: &str) -> Entry {
    let t = text.trim();
    if t.is_empty() {
        return Entry { value: None, message: None };
    }
    let message = Some(format!("Enter 0 to {} {}", max, unit));
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
pub fn limits_at(t: &AircraftType, m_g: i64) -> ((i128, i128), (i128, i128)) {
    let lo = t.envelope.iter().map(|p| p.0 * 1000).min().unwrap();
    let hi = t.envelope.iter().map(|p| p.0 * 1000).max().unwrap();
    let mc = m_g.clamp(lo, hi) as i128;
    let n = t.envelope.len();
    let mut vals: Vec<(i128, i128)> = Vec::new();
    for i in 0..n {
        let (a, b) = (t.envelope[i], t.envelope[(i + 1) % n]);
        let ((m1, c1), (m2, c2)) = if a.0 <= b.0 { (a, b) } else { (b, a) };
        let (m1, m2) = (m1 as i128 * 1000, m2 as i128 * 1000);
        if m1 == m2 || mc < m1 || mc > m2 {
            continue;
        }
        let dm = m2 - m1;
        vals.push((c1 as i128 * dm + (c2 - c1) as i128 * (mc - m1), dm));
    }
    let less = |x: &(i128, i128), y: &(i128, i128)| x.0 * y.1 < y.0 * x.1;
    let mut fwd = vals[0];
    let mut aft = vals[0];
    for v in &vals[1..] {
        if less(v, &fwd) {
            fwd = *v;
        }
        if less(&aft, v) {
            aft = *v;
        }
    }
    (fwd, aft)
}

fn check(t: &AircraftType, total_g: i64, moment_gmm: i64, complete: bool) -> State {
    let (fwd, aft) = limits_at(t, total_g);
    let (mo, m) = (moment_gmm as i128, total_g as i128);
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
    let mut indications = Vec::new();
    if !complete {
        indications.push(INCOMPLETE);
    } else {
        if mass_exceeded {
            indications.push(OUT_MASS);
        }
        if cg_state != CgState::Within {
            indications.push(OUT_CG);
        }
        if indications.is_empty() {
            indications.push(WITHIN);
        }
    }
    State { total_g, moment_gmm, mass_exceeded, cg_state, fwd_limit: fwd, aft_limit: aft, indications }
}

/// Evaluate a loading: one text per loading station (kg), the usable fuel at take-off (L) and the
/// planned fuel burn (L).
pub fn evaluate(aircraft: &Aircraft, fuel: &FuelType, density_g_per_l: i64, texts: &[&str], fuel_text: &str, burn_text: &str) -> Evaluation {
    let t = &TYPES[aircraft.type_index];
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

impl State {
    /// Total mass rounded to 1 kg.
    pub fn total_kg(&self) -> i64 {
        round_div(self.total_g as i128, 1000) as i64
    }
    /// Centre of gravity rounded to 1 mm (0.001 m).
    pub fn cg_mm_rounded(&self) -> i64 {
        if self.total_g == 0 {
            return 0;
        }
        round_div(self.moment_gmm as i128, self.total_g as i128) as i64
    }
    pub fn cg_exact_mm(&self) -> f64 {
        self.moment_gmm as f64 / self.total_g.max(1) as f64
    }
    pub fn within(&self) -> bool {
        self.indications == [WITHIN]
    }
}

/// Mass in g rounded to 1 kg.
pub fn kg_rounded(g: i64) -> i64 {
    round_div(g as i128, 1000) as i64
}

/// Moment in g·mm rounded to tenths of kg·m.
pub fn moment_tenths(gmm: i64) -> i64 {
    round_div(gmm as i128, 100_000) as i64
}
