//! WebAssembly interface: byte buffers in, JSON out (pointer << 32 | length).
//!
//! The only module with `unsafe` code; every unsafe block states why it is sound.

use std::sync::{Mutex, PoisonError};

/// The result buffer of the last call; read by the caller before the next call.
static OUT: Mutex<Vec<u8>> = Mutex::new(Vec::new());

/// Reserve `len` bytes for an input string; the caller writes UTF-8 there.
#[unsafe(no_mangle)]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    Box::into_raw(vec![0_u8; len.max(1)].into_boxed_slice()).cast::<u8>()
}

/// The input string written by the caller to a buffer from `alloc`; frees the buffer.
///
/// # Safety
/// `ptr` must come from `alloc(len)` and hold `len` bytes, and must not be used again.
unsafe fn take(ptr: *mut u8, len: usize) -> String {
    let slice = std::ptr::slice_from_raw_parts_mut(ptr, len.max(1));
    // SAFETY: `slice` is exactly the boxed slice that `alloc(len)` leaked (same pointer and length).
    let boxed = unsafe { Box::from_raw(slice) };
    let mut v = boxed.into_vec();
    v.truncate(len);
    String::from_utf8(v).unwrap_or_default()
}

/// Store the result and return its pointer << 32 | length (0 if it does not fit in 32 bits).
fn put(s: String) -> u64 {
    let mut out = OUT.lock().unwrap_or_else(PoisonError::into_inner);
    *out = s.into_bytes();
    match (u32::try_from(out.as_ptr().addr()), u32::try_from(out.len())) {
        (Ok(p), Ok(l)) => (u64::from(p) << 32) | u64::from(l),
        _ => 0,
    }
}

/// JSON of the build's fleet for the type key in the input buffer.
///
/// # Safety
/// `ptr`/`len` from `alloc`. Returns pointer << 32 | length of the JSON result.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn fleet(ptr: *mut u8, len: usize) -> u64 {
    // SAFETY: the caller passes a buffer from `alloc(len)`, as documented.
    put(crate::fleet_json(&unsafe { take(ptr, len) }))
}

/// JSON of the evaluation of the loading in the input buffer.
///
/// # Safety
/// `ptr`/`len` from `alloc`. Returns pointer << 32 | length of the JSON result.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn evaluate(ptr: *mut u8, len: usize) -> u64 {
    // SAFETY: the caller passes a buffer from `alloc(len)`, as documented.
    put(crate::evaluate_json(&unsafe { take(ptr, len) }))
}
