//! Weight and Balance calculation core (invented aircraft, not for flight operations).
//! Compiled to WebAssembly without external crates; the web app talks to it through a
//! small byte-buffer interface: `alloc`, `fleet` and `evaluate`, each returning JSON.

pub mod calc;
pub mod fleet;
pub mod fuel;

use calc::{evaluate as eval, kg_rounded, moment_tenths, CgState, State};
use fleet::{fleet_of_type, Aircraft, FLEET_CSV, TYPES};

fn esc(s: &str) -> String {
    let mut o = String::with_capacity(s.len() + 2);
    o.push('"');
    for c in s.chars() {
        match c {
            '"' => o.push_str("\\\""),
            '\\' => o.push_str("\\\\"),
            c if (c as u32) < 0x20 => o.push_str(&format!("\\u{:04x}", c as u32)),
            c => o.push(c),
        }
    }
    o.push('"');
    o
}

fn frac(f: (i128, i128)) -> String {
    format!("{}", f.0 as f64 / f.1 as f64)
}

/// JSON of the build's fleet with the data of its aircraft type.
pub fn fleet_json(type_key: &str) -> String {
    if let Err(e) = fleet::parse_fleet(FLEET_CSV) {
        return format!("{{\"error\":{}}}", esc(&format!("fleet data file: {}", e)));
    }
    let list = fleet_of_type(FLEET_CSV, type_key);
    let Some(ti) = fleet::type_index(type_key) else { return "{\"error\":\"unknown aircraft type\"}".into() };
    let fd = match fuel::fuel_data() {
        Ok(f) => f,
        Err(e) => return format!("{{\"error\":{}}}", esc(&format!("fuel interface data file: {}", e))),
    };
    let Some(ft) = fd.types.get(type_key) else { return "{\"error\":\"no fuel data for the aircraft type\"}".into() };
    // Date of the aircraft data: the newest date of the fleet data file and the fuel interface data file.
    let mut dates: Vec<String> = fleet::parse_fleet(FLEET_CSV).unwrap_or_default().iter().map(|a| a.weighing_date.clone()).collect();
    dates.extend(fd.aircraft.values().map(|r| r.reported_at.chars().take(10).collect::<String>()));
    let data_date = dates.into_iter().max().unwrap_or_default();
    let t = &TYPES[ti];
    let stations: Vec<String> = t
        .stations
        .iter()
        .map(|s| format!("{{\"key\":{},\"name\":{},\"armMm\":{},\"maxKg\":{}}}", esc(s.key), esc(s.name), s.arm_mm, s.max_kg))
        .collect();
    let env: Vec<String> = t.envelope.iter().map(|(m, c)| format!("[{},{}]", m, c)).collect();
    let ac: Vec<String> = list
        .iter()
        .map(|a| {
            let (fl, fat) = fd.aircraft.get(&a.id).map(|r| (r.litres.to_string(), esc(&r.reported_at))).unwrap_or(("null".into(), "null".into()));
            format!(
                "{{\"id\":{},\"emptyKg\":{},\"emptyArmMm\":{},\"weighingDate\":{},\"reportedFuelL\":{},\"reportedAt\":{}}}",
                esc(&a.id),
                a.empty_kg,
                a.empty_arm_mm,
                esc(&a.weighing_date),
                fl,
                fat
            )
        })
        .collect();
    format!(
        "{{\"type\":{{\"key\":{},\"name\":{},\"mtomKg\":{},\"stations\":[{}],\"envelope\":[{}],\"fuelArmMm\":{},\"fuelCapacityL\":{}}},\"aircraft\":[{}],\"dataDate\":{}}}",
        esc(t.key),
        esc(t.name),
        t.mtom_kg,
        stations.join(","),
        env.join(","),
        ft.arm_mm,
        ft.capacity_l,
        ac.join(","),
        esc(&data_date)
    )
}

fn entry_json(x: &calc::Entry) -> String {
    format!(
        "{{\"valid\":{},\"empty\":{},\"message\":{}}}",
        x.value.is_some(),
        x.value.is_none() && x.message.is_none(),
        x.message.as_deref().map(esc).unwrap_or("null".into())
    )
}

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

/// JSON of the evaluation of one loading. `input` is the type key of the build, the aircraft id,
/// one line per station, then the usable fuel at take-off and the planned fuel burn.
/// Only an aircraft of the build's type is evaluated.
pub fn evaluate_json(input: &str) -> String {
    let mut lines = input.split('\n');
    let type_key = lines.next().unwrap_or("").trim();
    let id = lines.next().unwrap_or("").trim();
    let all = fleet_of_type(FLEET_CSV, type_key);
    let Some(a): Option<&Aircraft> = all.iter().find(|a| a.id == id) else {
        return "{\"error\":\"unknown aircraft\"}".into();
    };
    let Ok(fd) = fuel::fuel_data() else { return "{\"error\":\"fuel interface data file\"}".into() };
    let Some(ft) = fd.types.get(type_key) else { return "{\"error\":\"no fuel data\"}".into() };
    let n = TYPES[a.type_index].stations.len();
    let texts: Vec<&str> = lines.collect();
    let get = |i: usize| texts.get(i).copied().unwrap_or("");
    let e = eval(a, ft, fd.density_g_per_l, &texts[..n.min(texts.len())], get(n), get(n + 1));
    let entries: Vec<String> = e.entries.iter().map(entry_json).collect();
    let row_json = |r: &calc::Row| {
            format!(
                "{{\"name\":{},\"litres\":{},\"kg\":{},\"armMm\":{},\"momentTenths\":{}}}",
                esc(&r.name),
                r.litres.map(|l| l.to_string()).unwrap_or("null".into()),
                kg_rounded(r.g),
                r.arm_mm,
                moment_tenths(r.moment_gmm)
            )
        };
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

// ---- WebAssembly interface -------------------------------------------------------------

static mut OUT: Vec<u8> = Vec::new();

/// Reserve `len` bytes for an input string; the caller writes UTF-8 there.
#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(len.max(1));
    let p = v.as_mut_ptr();
    std::mem::forget(v);
    p
}

/// # Safety
/// `ptr` must come from `alloc(len)` and hold `len` bytes.
unsafe fn take(ptr: *mut u8, len: usize) -> String {
    let v = Vec::from_raw_parts(ptr, len, len.max(1));
    String::from_utf8(v).unwrap_or_default()
}

fn put(s: String) -> u64 {
    // SAFETY: single-threaded WebAssembly; the buffer is read by the caller before the next call.
    unsafe {
        let out = &mut *std::ptr::addr_of_mut!(OUT);
        *out = s.into_bytes();
        ((out.as_ptr() as u64) << 32) | out.len() as u64
    }
}

/// # Safety
/// `ptr`/`len` from `alloc`. Returns pointer << 32 | length of the JSON result.
#[no_mangle]
pub unsafe extern "C" fn fleet(ptr: *mut u8, len: usize) -> u64 {
    put(fleet_json(&take(ptr, len)))
}

/// # Safety
/// `ptr`/`len` from `alloc`. Returns pointer << 32 | length of the JSON result.
#[no_mangle]
pub unsafe extern "C" fn evaluate(ptr: *mut u8, len: usize) -> u64 {
    put(evaluate_json(&take(ptr, len)))
}
