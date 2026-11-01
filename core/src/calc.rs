//! Mass and balance calculation with exact integer arithmetic (decision on units and rounding):
//! masses in kg, lever arms in mm, moments in kg·mm; limits compared as integer products.

use crate::fleet::{Aircraft, AircraftType, TYPES};

pub const WITHIN: &str = "Within limits (without fuel)";
pub const OUT_MASS: &str = "Outside limits: total mass above maximum take-off mass";
pub const OUT_CG: &str = "Outside limits: centre of gravity outside envelope";
pub const INCOMPLETE: &str = "Check not complete: fill in or correct the marked entries";

#[derive(Debug, PartialEq, Clone, Copy)]
pub enum CgState {
    Within,
    Forward,
    Aft,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Entry {
    /// Mass in kg when the entry is valid.
    pub kg: Option<i64>,
    /// Message next to the entry when it is invalid; None for a valid or an empty entry.
    pub message: Option<String>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Row {
    pub name: String,
    pub kg: i64,
    pub arm_mm: i64,
    pub moment_kgmm: i64,
}

#[derive(Debug, PartialEq, Clone)]
pub struct Evaluation {
    pub entries: Vec<Entry>,
    pub complete: bool,
    pub total_kg: i64,
    pub moment_kgmm: i64,
    /// Exact centre of gravity as a fraction moment/total (mm).
    pub cg_num: i64,
    pub cg_den: i64,
    pub mass_exceeded: bool,
    pub cg_state: CgState,
    /// Forward and aft limit at the evaluated mass, as fractions (num, den) in mm.
    pub fwd_limit: (i128, i128),
    pub aft_limit: (i128, i128),
    pub indications: Vec<&'static str>,
    pub rows: Vec<Row>,
}

/// Round a/b half away from zero (b > 0).
pub fn round_div(a: i128, b: i128) -> i128 {
    if a >= 0 {
        (2 * a + b) / (2 * b)
    } else {
        -((-2 * a + b) / (2 * b))
    }
}

/// Parse one entry: a whole number from 0 to max kg; empty is None without message.
pub fn parse_entry(text: &str, max_kg: i64) -> Entry {
    let t = text.trim();
    if t.is_empty() {
        return Entry { kg: None, message: None };
    }
    let message = Some(format!("Enter 0 to {} kg", max_kg));
    if !t.bytes().all(|b| b.is_ascii_digit()) || t.len() > 6 {
        return Entry { kg: None, message };
    }
    let v: i64 = t.parse().unwrap_or(i64::MAX);
    if v > max_kg {
        return Entry { kg: None, message };
    }
    Entry { kg: Some(v), message: None }
}

/// Forward and aft limit (exact fractions in mm) of the envelope at mass m (clamped to the envelope).
pub fn limits_at(t: &AircraftType, m: i64) -> ((i128, i128), (i128, i128)) {
    let lo = t.envelope.iter().map(|p| p.0).min().unwrap();
    let hi = t.envelope.iter().map(|p| p.0).max().unwrap();
    let mc = m.clamp(lo, hi) as i128;
    let n = t.envelope.len();
    let mut vals: Vec<(i128, i128)> = Vec::new();
    for i in 0..n {
        let (a, b) = (t.envelope[i], t.envelope[(i + 1) % n]);
        let ((m1, c1), (m2, c2)) = if a.0 <= b.0 { (a, b) } else { (b, a) };
        if m1 == m2 || (mc as i64) < m1 || (mc as i64) > m2 {
            continue;
        }
        let dm = (m2 - m1) as i128;
        vals.push((c1 as i128 * dm + (c2 - c1) as i128 * (mc - m1 as i128), dm));
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

pub fn evaluate(aircraft: &Aircraft, texts: &[&str]) -> Evaluation {
    let t = &TYPES[aircraft.type_index];
    let entries: Vec<Entry> = t
        .stations
        .iter()
        .enumerate()
        .map(|(i, s)| parse_entry(texts.get(i).copied().unwrap_or(""), s.max_kg))
        .collect();
    let complete = entries.iter().all(|e| e.kg.is_some());
    let mut rows = vec![Row {
        name: "Empty mass".into(),
        kg: aircraft.empty_kg,
        arm_mm: aircraft.empty_arm_mm,
        moment_kgmm: aircraft.empty_kg * aircraft.empty_arm_mm,
    }];
    for (s, e) in t.stations.iter().zip(&entries) {
        let kg = e.kg.unwrap_or(0);
        rows.push(Row { name: s.name.into(), kg, arm_mm: s.arm_mm, moment_kgmm: kg * s.arm_mm });
    }
    let total_kg: i64 = rows.iter().map(|r| r.kg).sum();
    let moment_kgmm: i64 = rows.iter().map(|r| r.moment_kgmm).sum();
    let (fwd, aft) = limits_at(t, total_kg);
    let (mo, m) = (moment_kgmm as i128, total_kg as i128);
    let cg_state = if mo * fwd.1 < fwd.0 * m {
        CgState::Forward
    } else if mo * aft.1 > aft.0 * m {
        CgState::Aft
    } else {
        CgState::Within
    };
    let mass_exceeded = total_kg > t.mtom_kg;
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
    Evaluation {
        entries,
        complete,
        total_kg,
        moment_kgmm,
        cg_num: moment_kgmm,
        cg_den: total_kg,
        mass_exceeded,
        cg_state,
        fwd_limit: fwd,
        aft_limit: aft,
        indications,
        rows,
    }
}

impl Evaluation {
    /// Centre of gravity rounded to 1 mm (0.001 m).
    pub fn cg_mm_rounded(&self) -> i64 {
        round_div(self.cg_num as i128, self.cg_den as i128) as i64
    }
    pub fn within(&self) -> bool {
        self.indications == [WITHIN]
    }
}

/// Moment in kg·mm rounded to tenths of kg·m.
pub fn moment_tenths(kgmm: i64) -> i64 {
    round_div(kgmm as i128, 100) as i64
}
