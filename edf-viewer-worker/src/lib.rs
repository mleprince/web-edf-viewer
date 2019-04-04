#![allow(unused)]

mod edf_reader;
mod model;
mod utils;

extern crate fixedbitset;
extern crate js_sys;
extern crate wasm_bindgen;

#[macro_use]
extern crate serde_derive;

extern crate web_sys;

use fixedbitset::FixedBitSet;

use model::*;

use edf_reader::*;

use std::mem;
use std::os::raw::c_void;
use std::slice;

use web_sys::console;

// use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

cfg_if::cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

// In order to work with the memory we expose (de)allocation methods
#[no_mangle]
#[wasm_bindgen]
pub extern "C" fn alloc(size: usize) -> *mut c_void {
    utils::set_panic_hook();
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    return ptr as *mut c_void;
}

#[no_mangle]
#[wasm_bindgen]
pub extern "C" fn dealloc(ptr: *mut c_void, cap: usize) {
    unsafe {
        let _buf = Vec::from_raw_parts(ptr, 0, cap);
    }
}

////////////////////
/// Statics
///

static mut EDF_FILE: Option<EDFFile> = None;

static mut CURRENT_MONTAGE: Option<Montage> = None;

#[wasm_bindgen]
pub fn compute(result_pointer: *mut u8, width: usize, height: usize) {
    let length = width * height;

    let result = unsafe { slice::from_raw_parts_mut(result_pointer, length) };

    let mut j = 0;
    for i in 0..800000 {
        result[i] = i as u8;
    }
}

#[wasm_bindgen]
pub fn compute_window(
    edf_file_serde: &JsValue,
    window_data: *mut u8,
    window_width: usize,
    window_height: usize,
) {
    let edf_file: EDFFile = edf_file_serde.into_serde().unwrap();

    log!("{:?}", edf_file);
}

#[wasm_bindgen]
pub fn set_current_montage(val: &JsValue) {
    let example: Montage = val.into_serde().unwrap();

    unsafe {
        log!("new current montage : {:?}", &example);
        CURRENT_MONTAGE = Some(example);
    }
}

#[wasm_bindgen]
pub fn set_edf_file(val: &JsValue) {
    let example: EDFFile = val.into_serde().unwrap();

    unsafe {
        log!("new edf file : {:?}", &example);
        EDF_FILE = Some(example);
    }
}

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
}
