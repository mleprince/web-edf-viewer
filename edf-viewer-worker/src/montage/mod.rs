pub mod model;

use edf_reader::model::EDFHeader;
use futures::Future;
use model::*;
use std::io::{Error, ErrorKind};
use wasm_bindgen::prelude::*;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! debug {
    ( $( $t:tt )* ) => {
        web_sys::console::debug_1(&format!( $( $t )* ).into());
    }
}


static mut CURRENT_MONTAGE: Option<Montage> = None;


pub fn set_current_montage(val: Montage) {
    debug!("set montage : {}",val.label);
    unsafe {
        CURRENT_MONTAGE = Some(val);
    }
}

// TODO : delete this clone call
fn get_current_montage() -> Option<Montage> {
    unsafe { CURRENT_MONTAGE.clone() }
}

pub fn apply_montage(
    data: Vec<Vec<f32>>,
    edf_header: &EDFHeader,
) -> Result<Vec<(Signal, Vec<f32>)>, Error> {
    match get_current_montage() {
        Some(montage) => Ok(montage
            .channels
            .into_iter()
            .map( |signal: Signal| {
                // TODO : delete this clone call
                (signal.clone(),recursion(&data, signal.operation))
            })
            .collect()),
        None => Err(Error::new(ErrorKind::Other, "There is no current montage")),
    }
}

fn recursion(data: &Vec<Vec<f32>>, operation: Operation) -> Vec<f32> {
    match operation {
        Operation::Constant { gain, signal_id } => data[signal_id as usize][..]
            .iter()
            .map(|v| v * gain)
            .collect(),
        Operation::Composition {
            gain,
            ch1,
            ch2,
            operation,
        } => {
            let data_ch1 = recursion(data, *ch1);
            let data_ch2 = recursion(data, *ch2);

            match operation {
                OperationType::Add => data_ch1
                    .iter()
                    .zip(data_ch2.iter())
                    .map(|(v1, v2)| v1 + v2)
                    .collect(),
                OperationType::Minus => data_ch1
                    .iter()
                    .zip(data_ch2.iter())
                    .map(|(v1, v2)| v1 - v2)
                    .collect(),
            }
        }
    }
}
