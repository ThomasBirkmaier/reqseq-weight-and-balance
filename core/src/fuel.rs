//! The fuel interface data file of the supplier's fuel system module (`data/fuel-module.json`):
//! fuel density, per aircraft type the fuel lever arm and usable capacity, per aircraft the last
//! reported usable fuel. Read with a minimal JSON reader (no external crates). Decimal values are
//! read as exact integers: density in g/L, lever arm in mm.

use std::collections::BTreeMap;

/// The fuel interface data file compiled into the build.
pub const FUEL_JSON: &str = include_str!("../../data/fuel-module.json");

#[derive(Debug, Clone, PartialEq)]
pub enum Json {
    Null,
    Bool(bool),
    /// A number kept as its text, so that decimals can be read exactly.
    Num(String),
    Str(String),
    Arr(Vec<Json>),
    Obj(BTreeMap<String, Json>),
}

struct P<'a> {
    s: &'a [u8],
    i: usize,
}

impl<'a> P<'a> {
    fn ws(&mut self) {
        while self.i < self.s.len() && (self.s[self.i] as char).is_ascii_whitespace() {
            self.i += 1;
        }
    }
    fn eat(&mut self, c: u8) -> Result<(), String> {
        self.ws();
        if self.s.get(self.i) == Some(&c) {
            self.i += 1;
            Ok(())
        } else {
            Err(format!("expected '{}' at byte {}", c as char, self.i))
        }
    }
    fn value(&mut self) -> Result<Json, String> {
        self.ws();
        match self.s.get(self.i) {
            Some(b'{') => {
                self.i += 1;
                let mut m = BTreeMap::new();
                self.ws();
                if self.s.get(self.i) == Some(&b'}') {
                    self.i += 1;
                    return Ok(Json::Obj(m));
                }
                loop {
                    self.ws();
                    let Json::Str(k) = self.value()? else { return Err("object key".into()) };
                    self.eat(b':')?;
                    let v = self.value()?;
                    m.insert(k, v);
                    self.ws();
                    match self.s.get(self.i) {
                        Some(b',') => self.i += 1,
                        Some(b'}') => {
                            self.i += 1;
                            return Ok(Json::Obj(m));
                        }
                        _ => return Err(format!("expected ',' or '}}' at byte {}", self.i)),
                    }
                }
            }
            Some(b'[') => {
                self.i += 1;
                let mut a = Vec::new();
                self.ws();
                if self.s.get(self.i) == Some(&b']') {
                    self.i += 1;
                    return Ok(Json::Arr(a));
                }
                loop {
                    a.push(self.value()?);
                    self.ws();
                    match self.s.get(self.i) {
                        Some(b',') => self.i += 1,
                        Some(b']') => {
                            self.i += 1;
                            return Ok(Json::Arr(a));
                        }
                        _ => return Err(format!("expected ',' or ']' at byte {}", self.i)),
                    }
                }
            }
            Some(b'"') => {
                self.i += 1;
                let mut out = String::new();
                loop {
                    match self.s.get(self.i) {
                        None => return Err("unterminated string".into()),
                        Some(b'"') => {
                            self.i += 1;
                            return Ok(Json::Str(out));
                        }
                        Some(b'\\') => {
                            let c = *self.s.get(self.i + 1).ok_or("escape")?;
                            self.i += 2;
                            match c {
                                b'n' => out.push('\n'),
                                b't' => out.push('\t'),
                                b'u' => {
                                    let h = std::str::from_utf8(self.s.get(self.i..self.i + 4).ok_or("escape")?).map_err(|_| "escape")?;
                                    out.push(char::from_u32(u32::from_str_radix(h, 16).map_err(|_| "escape")?).unwrap_or('?'));
                                    self.i += 4;
                                }
                                c => out.push(c as char),
                            }
                        }
                        Some(_) => {
                            let start = self.i;
                            while self.i < self.s.len() && self.s[self.i] != b'"' && self.s[self.i] != b'\\' {
                                self.i += 1;
                            }
                            out.push_str(std::str::from_utf8(&self.s[start..self.i]).map_err(|_| "utf-8")?);
                        }
                    }
                }
            }
            Some(b't') if self.s[self.i..].starts_with(b"true") => {
                self.i += 4;
                Ok(Json::Bool(true))
            }
            Some(b'f') if self.s[self.i..].starts_with(b"false") => {
                self.i += 5;
                Ok(Json::Bool(false))
            }
            Some(b'n') if self.s[self.i..].starts_with(b"null") => {
                self.i += 4;
                Ok(Json::Null)
            }
            Some(c) if c.is_ascii_digit() || *c == b'-' => {
                let start = self.i;
                while self.i < self.s.len() && matches!(self.s[self.i], b'0'..=b'9' | b'-' | b'+' | b'.' | b'e' | b'E') {
                    self.i += 1;
                }
                Ok(Json::Num(String::from_utf8_lossy(&self.s[start..self.i]).into_owned()))
            }
            _ => Err(format!("unexpected input at byte {}", self.i)),
        }
    }
}

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
pub fn decimal_scaled(t: &str, scale: u32) -> Result<i64, String> {
    let (int, frac) = t.split_once('.').unwrap_or((t, ""));
    if int.is_empty() || !int.bytes().all(|b| b.is_ascii_digit()) || !frac.bytes().all(|b| b.is_ascii_digit()) || frac.len() > scale as usize {
        return Err(format!("not a decimal with at most {} places: {}", scale, t));
    }
    let f = format!("{:0<width$}", frac, width = scale as usize);
    Ok(int.parse::<i64>().map_err(|e| e.to_string())? * 10_i64.pow(scale) + if f.is_empty() { 0 } else { f.parse::<i64>().map_err(|e| e.to_string())? })
}

#[derive(Debug, Clone, PartialEq)]
pub struct FuelType {
    pub arm_mm: i64,
    pub capacity_l: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FuelReport {
    pub litres: i64,
    pub reported_at: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct FuelData {
    pub interface_version: String,
    pub density_g_per_l: i64,
    /// Keyed by the type key of the build (hc4, hc2).
    pub types: BTreeMap<String, FuelType>,
    pub aircraft: BTreeMap<String, FuelReport>,
}

/// The type key of the build for the type name of the interface file ("HC-4" → "hc4").
pub fn type_key_of(name: &str) -> String {
    name.replace('-', "").to_lowercase()
}

fn get<'a>(o: &'a Json, k: &str) -> Result<&'a Json, String> {
    match o {
        Json::Obj(m) => m.get(k).ok_or(format!("missing field {}", k)),
        _ => Err(format!("not an object at {}", k)),
    }
}
fn num(o: &Json, k: &str) -> Result<String, String> {
    match get(o, k)? {
        Json::Num(n) => Ok(n.clone()),
        _ => Err(format!("{} is not a number", k)),
    }
}
fn text(o: &Json, k: &str) -> Result<String, String> {
    match get(o, k)? {
        Json::Str(s) => Ok(s.clone()),
        _ => Err(format!("{} is not a string", k)),
    }
}

pub fn parse_fuel(json: &str) -> Result<FuelData, String> {
    let root = parse_json(json)?;
    let interface_version = text(&root, "interfaceVersion")?;
    if !interface_version.starts_with("1.") {
        return Err(format!("unsupported interface version {}", interface_version));
    }
    let density_g_per_l = decimal_scaled(&num(&root, "fuelDensityKgPerL")?, 3)?;
    let mut types = BTreeMap::new();
    if let Json::Obj(m) = get(&root, "types")? {
        for (name, v) in m {
            let arm_mm = decimal_scaled(&num(v, "fuelLeverArmM")?, 3)?;
            let capacity_l = num(v, "usableCapacityL")?.parse().map_err(|_| "usableCapacityL")?;
            types.insert(type_key_of(name), FuelType { arm_mm, capacity_l });
        }
    }
    let mut aircraft = BTreeMap::new();
    if let Json::Obj(m) = get(&root, "aircraft")? {
        for (id, v) in m {
            let litres = num(v, "usableFuelL")?.parse().map_err(|_| "usableFuelL")?;
            aircraft.insert(id.clone(), FuelReport { litres, reported_at: text(v, "reportedAtUtc")? });
        }
    }
    Ok(FuelData { interface_version, density_g_per_l, types, aircraft })
}

/// The fuel data of this build; a broken file is a build error caught by the tests.
pub fn fuel_data() -> Result<FuelData, String> {
    parse_fuel(FUEL_JSON)
}
