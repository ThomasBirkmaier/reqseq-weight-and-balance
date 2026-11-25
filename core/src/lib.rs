//! Weight and Balance calculation core (invented aircraft, not for flight operations).
//!
//! Compiled to WebAssembly without external crates; the web app talks to it through a
//! small byte-buffer interface: `alloc`, `fleet` and `evaluate`, each returning JSON.
//!
//! Modules: [`fleet`] (type data and fleet data file), [`fuel`] (fuel interface data file),
//! [`json`] (minimal JSON reader), [`limits`] (limit check rule), [`calc`] (evaluation of a loading), [`output`] (JSON results) and
//! [`wasm`] (the byte-buffer interface).

pub mod calc;
pub mod fleet;
pub mod fuel;
pub mod json;
pub mod limits;
pub mod output;
#[expect(
    unsafe_code,
    reason = "the WebAssembly interface hands raw buffers to and from JavaScript"
)]
pub mod wasm;

pub use output::{evaluate_json, fleet_json};
