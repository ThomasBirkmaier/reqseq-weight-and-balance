//! The JSON interface of the core: the fleet of a build and the evaluation of a loading, as the
//! web app reads them (`web/src/core.ts` checks the same shape at run time).

use crate::calc::{self, CgState, State, evaluate as eval, kg_rounded, moment_tenths};
use crate::fleet::{self, Aircraft, AircraftType, FLEET_CSV, TYPES, fleet_of_type};
use crate::fuel::{self, FuelData};
use std::fmt::Write as _;

/// JSON string literal of `s`, with quotes, backslashes and control characters escaped.
fn esc(s: &str) -> String {
    let mut o = String::with_capacity(s.len().saturating_add(2));
    o.push('"');
    for c in s.chars() {
        match c {
            '"' => o.push_str("\\\""),
            '\\' => o.push_str("\\\\"),
            c if u32::from(c) < 0x20 => {
                // Writing to a String cannot fail.
                let _ = write!(o, "\\u{:04x}", u32::from(c));
            }
            c => o.push(c),
        }
    }
    o.push('"');
    o
}

/// Decimal text of the fraction `num / den` (a limit in mm), for display only.
#[expect(
    clippy::as_conversions,
    clippy::cast_precision_loss,
    reason = "display value only; limits are a few thousand mm times a mass in g, far below 2^52"
)]
fn frac(f: (i128, i128)) -> String {
    format!("{}", f.0 as f64 / f.1 as f64)
}

/// JSON of an error message.
fn error_json(message: &str) -> String {
    format!("{{\"error\":{}}}", esc(message))
}

/// Date of the aircraft data: the newest date of the fleet data file and the fuel interface data file.
fn data_date(all: &[Aircraft], fd: &FuelData) -> String {
    all.iter()
        .map(|a| a.weighing_date.clone())
        .chain(
            fd.aircraft
                .values()
                .map(|r| r.reported_at.chars().take(10).collect::<String>()),
        )
        .max()
        .unwrap_or_default()
}

/// JSON of the type data with the fuel data of the type.
fn type_json(t: &AircraftType, ft: &fuel::FuelType) -> String {
    let stations: Vec<String> = t
        .stations
        .iter()
        .map(|s| {
            format!(
                "{{\"key\":{},\"name\":{},\"armMm\":{},\"maxKg\":{}}}",
                esc(s.key),
                esc(s.name),
                s.arm_mm,
                s.max_kg
            )
        })
        .collect();
    let env: Vec<String> = t.envelope.iter().map(|(m, c)| format!("[{m},{c}]")).collect();
    format!(
        "{{\"key\":{},\"name\":{},\"mtomKg\":{},\"stations\":[{}],\"envelope\":[{}],\"fuelArmMm\":{},\"fuelCapacityL\":{}}}",
        esc(t.key),
        esc(t.name),
        t.mtom_kg,
        stations.join(","),
        env.join(","),
        ft.arm_mm,
        ft.capacity_l
    )
}

/// JSON of one aircraft with its last fuel report (null without a report).
fn aircraft_json(a: &Aircraft, fd: &FuelData) -> String {
    let (fl, fat) = fd.aircraft.get(&a.id).map_or_else(
        || ("null".into(), "null".into()),
        |r| (r.litres.to_string(), esc(&r.reported_at)),
    );
    format!(
        "{{\"id\":{},\"emptyKg\":{},\"emptyArmMm\":{},\"weighingDate\":{},\"reportedFuelL\":{},\"reportedAt\":{}}}",
        esc(&a.id),
        a.empty_kg,
        a.empty_arm_mm,
        esc(&a.weighing_date),
        fl,
        fat
    )
}

/// JSON of the build's fleet with the data of its aircraft type.
#[must_use]
pub fn fleet_json(type_key: &str) -> String {
    let all = match fleet::parse_fleet(FLEET_CSV) {
        Ok(all) => all,
        Err(e) => return error_json(&format!("fleet data file: {e}")),
    };
    let Some(t) = fleet::type_index(type_key).and_then(|ti| TYPES.get(ti)) else {
        return error_json("unknown aircraft type");
    };
    let fd = match fuel::fuel_data() {
        Ok(f) => f,
        Err(e) => return error_json(&format!("fuel interface data file: {e}")),
    };
    let Some(ft) = fd.types.get(type_key) else {
        return error_json("no fuel data for the aircraft type");
    };
    let ac: Vec<String> = fleet_of_type(FLEET_CSV, type_key)
        .iter()
        .map(|a| aircraft_json(a, &fd))
        .collect();
    format!(
        "{{\"type\":{},\"aircraft\":[{}],\"dataDate\":{}}}",
        type_json(t, ft),
        ac.join(","),
        esc(&data_date(&all, &fd))
    )
}

/// JSON of one entry: valid, empty and its message.
fn entry_json(x: &calc::Entry) -> String {
    format!(
        "{{\"valid\":{},\"empty\":{},\"message\":{}}}",
        x.value.is_some(),
        x.value.is_none() && x.message.is_none(),
        x.message.as_deref().map_or_else(|| "null".into(), esc)
    )
}

/// JSON of the limit check result for one state of the flight.
fn state_json(e: &State) -> String {
    let cg = match e.cg_state {
        CgState::Within => "within",
        CgState::Forward => "forward",
        CgState::Aft => "aft",
    };
    let ind: Vec<String> = e.indications.iter().map(|s| esc(s)).collect();
    format!(
        "{{\"totalKg\":{},\"momentTenths\":{},\"cgMm\":{},\"cgExactMm\":{},\"massExceeded\":{},\"cgState\":\"{}\",\"fwdLimitMm\":{},\"aftLimitMm\":{},\"within\":{},\"indications\":[{}]}}",
        e.total_kg(),
        moment_tenths(e.moment_gmm),
        e.cg_mm_rounded(),
        e.cg_exact_mm(),
        e.mass_exceeded,
        cg,
        frac(e.fwd_limit),
        frac(e.aft_limit),
        e.within(),
        ind.join(",")
    )
}

/// JSON of one row of the loading table.
fn row_json(r: &calc::Row) -> String {
    format!(
        "{{\"name\":{},\"litres\":{},\"kg\":{},\"armMm\":{},\"momentTenths\":{}}}",
        esc(&r.name),
        r.litres.map_or_else(|| "null".into(), |l| l.to_string()),
        kg_rounded(r.g),
        r.arm_mm,
        moment_tenths(r.moment_gmm)
    )
}

/// JSON of the evaluation of one loading. `input` is the type key of the build, the aircraft id,
/// one line per station, then the usable fuel at take-off and the planned fuel burn.
///
/// Only an aircraft of the build's type is evaluated.
#[must_use]
pub fn evaluate_json(input: &str) -> String {
    let mut lines = input.split('\n');
    let type_key = lines.next().unwrap_or("").trim();
    let id = lines.next().unwrap_or("").trim();
    let all = fleet_of_type(FLEET_CSV, type_key);
    let Some(a): Option<&Aircraft> = all.iter().find(|a| a.id == id) else {
        return error_json("unknown aircraft");
    };
    let Ok(fd) = fuel::fuel_data() else {
        return error_json("fuel interface data file");
    };
    let Some(ft) = fd.types.get(type_key) else {
        return error_json("no fuel data");
    };
    let Some(t) = TYPES.get(a.type_index) else {
        return error_json("unknown aircraft type");
    };
    let n = t.stations.len();
    let texts: Vec<&str> = lines.collect();
    let get = |i: usize| texts.get(i).copied().unwrap_or("");
    let stations = texts.get(..n).unwrap_or(&texts);
    let e = eval(a, ft, fd.density_g_per_l, stations, get(n), get(n.saturating_add(1)));
    let entries: Vec<String> = e.entries.iter().map(entry_json).collect();
    let rows: Vec<String> = e.rows.iter().map(row_json).collect();
    format!(
        "{{\"complete\":{},\"entries\":[{}],\"fuel\":{},\"burn\":{},\"takeOff\":{},\"landing\":{},\"rows\":[{}],\"landingFuel\":{}}}",
        e.complete,
        entries.join(","),
        entry_json(&e.fuel),
        entry_json(&e.burn),
        state_json(&e.take_off),
        state_json(&e.landing),
        rows.join(","),
        row_json(&e.landing_fuel)
    )
}
