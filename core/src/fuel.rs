//! The fuel interface data file of the supplier's fuel system module (`data/fuel-module.json`).
//!
//! Content: fuel density, per aircraft type the fuel lever arm and usable capacity, per aircraft the last
//! reported usable fuel. Read with a minimal JSON reader (no external crates). Decimal values are
//! read as exact integers: density in g/L, lever arm in mm.

use std::collections::BTreeMap;

/// The fuel interface data file compiled into the build.
pub const FUEL_JSON: &str = include_str!("../../data/fuel-module.json");

/// A JSON value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Json {
    /// `null`.
    Null,
    /// `true` or `false`.
    Bool(bool),
    /// A number kept as its text, so that decimals can be read exactly.
    Num(String),
    /// A string.
    Str(String),
    /// An array.
    Arr(Vec<Self>),
    /// An object, keyed by member name.
    Obj(BTreeMap<String, Self>),
}

/// A minimal JSON parser over the bytes of the text.
struct P<'a> {
    /// The text.
    s: &'a [u8],
    /// Position of the next byte.
    i: usize,
}

impl P<'_> {
    /// The byte at the current position.
    fn peek(&self) -> Option<u8> {
        self.s.get(self.i).copied()
    }
    /// The rest of the text from the current position.
    fn rest(&self) -> &[u8] {
        self.s.get(self.i..).unwrap_or_default()
    }
    /// Move `n` bytes forward.
    const fn skip(&mut self, n: usize) {
        self.i = self.i.saturating_add(n);
    }
    /// Skip white space.
    fn ws(&mut self) {
        while self.peek().is_some_and(|b| b.is_ascii_whitespace()) {
            self.skip(1);
        }
    }
    /// Skip white space and the byte `c`.
    fn eat(&mut self, c: u8) -> Result<(), String> {
        self.ws();
        if self.peek() == Some(c) {
            self.skip(1);
            Ok(())
        } else {
            Err(format!("expected '{}' at byte {}", char::from(c), self.i))
        }
    }
    /// An object, after its `{`.
    fn object(&mut self) -> Result<Json, String> {
        let mut m = BTreeMap::new();
        self.ws();
        if self.peek() == Some(b'}') {
            self.skip(1);
            return Ok(Json::Obj(m));
        }
        loop {
            self.ws();
            let Json::Str(k) = self.value()? else { return Err("object key".into()) };
            self.eat(b':')?;
            let v = self.value()?;
            if m.contains_key(&k) {
                return Err(format!("duplicate object key {k}"));
            }
            _ = m.entry(k).or_insert(v);
            self.ws();
            match self.peek() {
                Some(b',') => self.skip(1),
                Some(b'}') => {
                    self.skip(1);
                    return Ok(Json::Obj(m));
                }
                _ => return Err(format!("expected ',' or '}}' at byte {}", self.i)),
            }
        }
    }
    /// An array, after its `[`.
    fn array(&mut self) -> Result<Json, String> {
        let mut a = Vec::new();
        self.ws();
        if self.peek() == Some(b']') {
            self.skip(1);
            return Ok(Json::Arr(a));
        }
        loop {
            a.push(self.value()?);
            self.ws();
            match self.peek() {
                Some(b',') => self.skip(1),
                Some(b']') => {
                    self.skip(1);
                    return Ok(Json::Arr(a));
                }
                _ => return Err(format!("expected ',' or ']' at byte {}", self.i)),
            }
        }
    }
    /// A string, after its opening quote.
    fn string(&mut self) -> Result<Json, String> {
        let mut out = String::new();
        loop {
            match self.peek() {
                None => return Err("unterminated string".into()),
                Some(b'"') => {
                    self.skip(1);
                    return Ok(Json::Str(out));
                }
                Some(b'\\') => {
                    let c = self.s.get(self.i.saturating_add(1)).copied().ok_or("escape")?;
                    self.skip(2);
                    match c {
                        b'n' => out.push('\n'),
                        b't' => out.push('\t'),
                        b'r' => out.push('\r'),
                        b'b' => out.push('\u{8}'),
                        b'f' => out.push('\u{c}'),
                        b'u' => {
                            let hex = self.rest().get(..4).ok_or("escape")?;
                            let h = std::str::from_utf8(hex).map_err(|_| "escape")?;
                            out.push(char::from_u32(u32::from_str_radix(h, 16).map_err(|_| "escape")?).unwrap_or('?'));
                            self.skip(4);
                        }
                        c => out.push(char::from(c)),
                    }
                }
                Some(_) => {
                    let rest = self.rest();
                    let n = rest.iter().position(|&b| b == b'"' || b == b'\\').unwrap_or(rest.len());
                    let chunk = rest.get(..n).unwrap_or_default();
                    out.push_str(std::str::from_utf8(chunk).map_err(|_| "utf-8")?);
                    self.skip(n);
                }
            }
        }
    }
    /// A number, kept as its text.
    fn number(&mut self) -> Json {
        let rest = self.rest();
        let n = rest.iter().position(|b| !matches!(b, b'0'..=b'9' | b'-' | b'+' | b'.' | b'e' | b'E')).unwrap_or(rest.len());
        let text = String::from_utf8_lossy(rest.get(..n).unwrap_or_default()).into_owned();
        self.skip(n);
        Json::Num(text)
    }
    /// The next value.
    fn value(&mut self) -> Result<Json, String> {
        self.ws();
        let rest = self.rest();
        match self.peek() {
            Some(b'{') => {
                self.skip(1);
                self.object()
            }
            Some(b'[') => {
                self.skip(1);
                self.array()
            }
            Some(b'"') => {
                self.skip(1);
                self.string()
            }
            Some(b't') if rest.starts_with(b"true") => {
                self.skip(4);
                Ok(Json::Bool(true))
            }
            Some(b'f') if rest.starts_with(b"false") => {
                self.skip(5);
                Ok(Json::Bool(false))
            }
            Some(b'n') if rest.starts_with(b"null") => {
                self.skip(4);
                Ok(Json::Null)
            }
            Some(c) if c.is_ascii_digit() || c == b'-' => Ok(self.number()),
            _ => Err(format!("unexpected input at byte {}", self.i)),
        }
    }
}

/// Parse a JSON text.
///
/// # Errors
/// What was expected and the byte position when the text is not a single JSON value.
pub fn parse_json(text: &str) -> Result<Json, String> {
    let mut p = P { s: text.as_bytes(), i: 0 };
    let v = p.value()?;
    p.ws();
    if p.i != p.s.len() {
        return Err("trailing input".into());
    }
    Ok(v)
}

/// A decimal number text as an exact integer in units of 10^-scale ("2.35", 3 → 2350).
///
/// # Errors
/// When the text is not a non-negative decimal with at most `scale` places, or does not fit in i64.
pub fn decimal_scaled(t: &str, scale: u32) -> Result<i64, String> {
    let (int, frac) = t.split_once('.').unwrap_or((t, ""));
    let width = usize::try_from(scale).map_err(|e| e.to_string())?;
    if int.is_empty() || !int.bytes().all(|b| b.is_ascii_digit()) || !frac.bytes().all(|b| b.is_ascii_digit()) || frac.len() > width {
        return Err(format!("not a decimal with at most {scale} places: {t}"));
    }
    let f = format!("{frac:0<width$}");
    let whole = int.parse::<i64>().map_err(|e| e.to_string())?;
    let part = if f.is_empty() { 0 } else { f.parse::<i64>().map_err(|e| e.to_string())? };
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
    if let Json::Obj(m) = o { m.get(k).ok_or_else(|| format!("missing field {k}")) } else { Err(format!("not an object at {k}")) }
}
/// Number member `k` of the object `o`, as its text.
fn num(o: &Json, k: &str) -> Result<String, String> {
    if let Json::Num(n) = get(o, k)? { Ok(n.clone()) } else { Err(format!("{k} is not a number")) }
}
/// String member `k` of the object `o`.
fn text(o: &Json, k: &str) -> Result<String, String> {
    if let Json::Str(s) = get(o, k)? { Ok(s.clone()) } else { Err(format!("{k} is not a string")) }
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
            _ = aircraft.entry(id.clone()).or_insert(FuelReport { litres, reported_at: text(v, "reportedAtUtc")? });
        }
    }
    Ok(FuelData { interface_version, density_g_per_l, types, aircraft })
}

/// The fuel data of this build; a broken file is a build error caught by the tests.
///
/// # Errors
/// As [`parse_fuel`] for the compiled-in file.
pub fn fuel_data() -> Result<FuelData, String> {
    parse_fuel(FUEL_JSON)
}
