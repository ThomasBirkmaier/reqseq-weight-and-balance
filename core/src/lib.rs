//! Weight and Balance calculation core (invented aircraft, not for flight operations).
//! Compiled to WebAssembly without external crates; the web app talks to it through a
//! small byte-buffer interface: `alloc`, `fleet` and `evaluate`, each returning JSON.

pub mod calc;
pub mod fleet;

use calc::{evaluate as eval, moment_tenths, CgState};
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
    let list = fleet_of_type(FLEET_CSV, type_key);
    let Some(ti) = fleet::type_index(type_key) else { return "{\"aircraft\":[]}".into() };
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
            format!(
                "{{\"id\":{},\"emptyKg\":{},\"emptyArmMm\":{},\"weighingDate\":{}}}",
                esc(&a.id),
                a.empty_kg,
                a.empty_arm_mm,
                esc(&a.weighing_date)
            )
        })
        .collect();
    format!(
        "{{\"type\":{{\"key\":{},\"name\":{},\"mtomKg\":{},\"stations\":[{}],\"envelope\":[{}]}},\"aircraft\":[{}]}}",
        esc(t.key),
        esc(t.name),
        t.mtom_kg,
        stations.join(","),
        env.join(","),
        ac.join(",")
    )
}

/// JSON of the evaluation of one loading. `input` is the aircraft id, then one line per station.
pub fn evaluate_json(input: &str) -> String {
    let mut lines = input.split('\n');
    let id = lines.next().unwrap_or("").trim();
    let all = fleet::parse_fleet(FLEET_CSV).unwrap_or_default();
    let Some(a): Option<&Aircraft> = all.iter().find(|a| a.id == id) else {
        return "{\"error\":\"unknown aircraft\"}".into();
    };
    let texts: Vec<&str> = lines.collect();
    let e = eval(a, &texts);
    let entries: Vec<String> = e
        .entries
        .iter()
        .map(|x| {
            format!(
                "{{\"valid\":{},\"empty\":{},\"message\":{}}}",
                x.kg.is_some(),
                x.kg.is_none() && x.message.is_none(),
                x.message.as_deref().map(esc).unwrap_or("null".into())
            )
        })
        .collect();
    let rows: Vec<String> = e
        .rows
        .iter()
        .map(|r| format!("{{\"name\":{},\"kg\":{},\"armMm\":{},\"momentTenths\":{}}}", esc(&r.name), r.kg, r.arm_mm, moment_tenths(r.moment_kgmm)))
        .collect();
    let ind: Vec<String> = e.indications.iter().map(|s| esc(s)).collect();
    let cg = match e.cg_state {
        CgState::Within => "within",
        CgState::Forward => "forward",
        CgState::Aft => "aft",
    };
    format!(
        "{{\"complete\":{},\"entries\":[{}],\"totalKg\":{},\"momentTenths\":{},\"cgMm\":{},\"cgExactMm\":{},\"massExceeded\":{},\"cgState\":\"{}\",\"fwdLimitMm\":{},\"aftLimitMm\":{},\"within\":{},\"indications\":[{}],\"rows\":[{}]}}",
        e.complete,
        entries.join(","),
        e.total_kg,
        moment_tenths(e.moment_kgmm),
        e.cg_mm_rounded(),
        e.cg_num as f64 / e.cg_den as f64,
        e.mass_exceeded,
        cg,
        frac(e.fwd_limit),
        frac(e.aft_limit),
        e.within(),
        ind.join(","),
        rows.join(",")
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
