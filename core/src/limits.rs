//! The limit check rule and the rounding of the shown values.
//!
//! The total mass is checked against the maximum take-off mass and the centre of gravity against
//! the envelope, with exact integer arithmetic: masses in g, moments in g·mm, limits as exact
//! fractions compared by cross-multiplication.

use crate::fleet::AircraftType;

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

/// Round a/b half away from zero (b > 0).
#[must_use]
pub const fn round_div(a: i128, b: i128) -> i128 {
    if a >= 0 {
        (2 * a + b) / (2 * b)
    } else {
        -((-2 * a + b) / (2 * b))
    }
}

/// An i128 result that is known to fit in i64 (a quotient of i64 values), saturated otherwise.
fn narrow(v: i128) -> i64 {
    i64::try_from(v).unwrap_or(if v < 0 { i64::MIN } else { i64::MAX })
}

/// Forward and aft limit (exact fractions in mm) of the envelope at mass m in g (clamped to the envelope).
///
/// An envelope without corners (not in the type data) gives the limits 0/1 mm, so that every
/// centre of gravity is outside.
#[must_use]
pub fn limits_at(t: &AircraftType, m_g: i64) -> ((i128, i128), (i128, i128)) {
    let masses = t.envelope.iter().map(|p| i128::from(p.0) * 1000);
    let (Some(lo), Some(hi)) = (masses.clone().min(), masses.max()) else {
        return ((0, 1), (0, 1));
    };
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
    let Some(first) = vals.next() else {
        return ((0, 1), (0, 1));
    };
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
pub(crate) fn check(t: &AircraftType, total_g: i64, moment_gmm: i64, complete: bool) -> State {
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
    let mass_below = t
        .envelope
        .iter()
        .map(|p| p.0)
        .min()
        .is_some_and(|lo| i128::from(total_g) < i128::from(lo) * 1000);
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
    State {
        total_g,
        moment_gmm,
        mass_exceeded,
        mass_below,
        cg_state,
        fwd_limit: fwd,
        aft_limit: aft,
        indications,
    }
}

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
