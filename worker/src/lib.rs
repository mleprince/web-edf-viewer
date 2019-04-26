#![allow(unused)]

mod display;
mod filter;
mod montage;
mod reader;

extern crate biquad;
extern crate edf_reader;
extern crate js_sys;
extern crate line_drawing;
extern crate wasm_bindgen;
extern crate wasm_bindgen_futures;
extern crate web_sys;

#[macro_use]
extern crate serde_derive;

use crate::montage::model::Signal;
use montage::model::Montage;
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
use wasm_bindgen::UnwrapThrowExt;
use wasm_bindgen_futures::{future_to_promise, spawn_local, JsFuture};
use web_sys::console;
use web_sys::window;
use web_sys::Blob;
use web_sys::CanvasRenderingContext2d;
use web_sys::File;
use web_sys::FileReader;

use wasm_bindgen::Clamped;
use web_sys::ImageData;

use edf_reader::async_reader::*;
use edf_reader::model::*;

use montage::model::*;

use display::*;

use futures::future::result;
use futures::{Async, Future, Poll};

use cfg_if::cfg_if;
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
pub fn init_reader(file: File) -> js_sys::Promise {
    future_to_promise(
        reader::init(file)
            .map(|header: EDFHeader| JsValue::from_serde(&header).unwrap_throw())
            .map_err(|e| to_js_error(e)),
    )
}

#[wasm_bindgen]
pub fn read_window(
    start_time: u32,
    duration: u32,
    width: u32,
    height: u32,
    canvas_id: String,
) -> js_sys::Promise {
    future_to_promise(
        reader::read_window(start_time, duration)
            // apply montage
            .and_then(|data: Vec<Vec<f32>>| {
                result(montage::apply_montage(
                    data,
                    reader::get_header().unwrap_throw(),
                ))
            })
            // apply filter
            .map(|data: Vec<(Signal, Vec<f32>)>| {
                data.iter()
                    .map(|(signal, signal_data)| {
                        (signal.clone(), filter::apply_filters(signal_data, &signal))
                    })
                    .collect()
            })
            // create chart matrix of pixels and display in canvas
            .and_then(move |data: Vec<(Signal, Vec<f32>)>| {
                let document = window().unwrap().document().unwrap();
                let canvas = document.get_element_by_id(&canvas_id).unwrap();
                let canvas: web_sys::HtmlCanvasElement = canvas
                    .dyn_into::<web_sys::HtmlCanvasElement>()
                    .map_err(|_| ())
                    .unwrap();

                let context = canvas
                    .get_context("2d")
                    .unwrap()
                    .unwrap()
                    .dyn_into::<web_sys::CanvasRenderingContext2d>()
                    .unwrap();

                let mut image_data: Vec<u8> =
                    PixelMatrix::new(width, height, data, RenderingType::Line).compute();

                let data = ImageData::new_with_u8_clamped_array_and_sh(
                    Clamped(&mut image_data),
                    width,
                    height,
                )
                .unwrap_throw();

                context.put_image_data(&data, 0.0, 0.0);

                Ok(JsValue::NULL)
            })
            .map_err(|e| to_js_error(e)),
    )
}

#[wasm_bindgen]
pub fn set_current_montage(val: &JsValue) {
    let montage: Montage = val.into_serde().unwrap_throw();
    montage::set_current_montage(montage);
}

fn to_js_error(error: Error) -> JsValue {
    JsValue::from(js_sys::Error::new(&format!("{:?}", error)))
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
