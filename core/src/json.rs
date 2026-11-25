//! A minimal JSON reader (no external crates).
//!
//! Numbers are kept as their text, so that the fuel interface data file can read decimals
//! exactly; duplicate object keys are an error.

use std::collections::BTreeMap;

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
            let Json::Str(k) = self.value()? else {
                return Err("object key".into());
            };
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
        let n = rest
            .iter()
            .position(|b| !matches!(b, b'0'..=b'9' | b'-' | b'+' | b'.' | b'e' | b'E'))
            .unwrap_or(rest.len());
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
    let mut p = P {
        s: text.as_bytes(),
        i: 0,
    };
    let v = p.value()?;
    p.ws();
    if p.i != p.s.len() {
        return Err("trailing input".into());
    }
    Ok(v)
}
