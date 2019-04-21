#![allow(unused)]

mod model;
mod utils;

mod js_async_reader;

extern crate edf_reader;
extern crate js_sys;
extern crate wasm_bindgen;
extern crate wasm_bindgen_futures;
extern crate web_sys;

#[macro_use]
extern crate serde_derive;

use model::*;

use std::any::Any;
use std::io::{Error, ErrorKind};
use std::mem;
use std::os::raw::c_void;
use std::slice;

use edf_reader::file_reader::AsyncFileReader;

use js_sys::Array;
use js_sys::ArrayBuffer;
use js_sys::Float32Array;
use js_sys::Function;
use js_sys::Promise;
use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::{future_to_promise, spawn_local, JsFuture};
use web_sys::console;
use web_sys::Blob;
use web_sys::File;
use web_sys::FileReader;

use edf_reader::async_reader::*;

use std::cell::RefCell;

use std::sync::Arc;

use js_async_reader::*;

use futures::{Async, Future, Poll};

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

#[wasm_bindgen]
pub fn init_error_panic() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn get_header(file: File) -> js_sys::Promise {
    let file_reader = JsAsyncReader::new(file);

    let future = AsyncEDFReader::init_with_file_reader(file_reader)
        .map(|edf_reader: AsyncEDFReader<JsAsyncReader>| {
            let js_value = JsValue::from_serde(&edf_reader.edf_header).unwrap();
            unsafe {
                EDF_READER = Some(edf_reader);
            }
            js_value
        })
        .map_err(|error: Error| JsValue::from(js_sys::Error::new(&format!("{:?}", error))));

    future_to_promise(future)
}

#[wasm_bindgen]
pub fn read_window(start_time: u32, duration: u32) -> js_sys::Promise {
    unsafe {
        match &EDF_READER {
            Some(edf_reader) => future_to_promise(
                edf_reader
                    .read_data_window(start_time as u64, duration as u64)
                    .map(|data: Vec<Vec<f32>>| {
                        let result = Array::new();

                        for channel_data in data {
                            result.push(&JsValue::from(Float32Array::view(&channel_data[..])));
                        }

                        JsValue::from(result)
                    })
                    .map_err(|error: Error| {
                        JsValue::from(js_sys::Error::new(&format!("{:?}", error)))
                    }),
            ),
            None => js_sys::Promise::reject(&JsValue::from(js_sys::Error::new(&String::from(
                "Reader has not been initialised",
            )))),
        }
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

static mut CURRENT_MONTAGE: Option<Montage> = None;
static mut EDF_READER: Option<AsyncEDFReader<JsAsyncReader>> = None;

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
pub fn set_current_montage(val: &JsValue) {
    let example: Montage = val.into_serde().unwrap();

    unsafe {
        log!("new current montage : {:?}", &example);
        CURRENT_MONTAGE = Some(example);
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
