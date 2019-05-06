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
    debug!("set montage : {}", val.label);
    unsafe {
        CURRENT_MONTAGE = Some(val);
    }
}

// TODO : delete this clone call
pub fn get_current_montage() -> Option<Montage> {
    unsafe { CURRENT_MONTAGE.clone() }
}

pub fn get_channel_view(data: &Vec<Vec<f32>>, operation: &Operation) -> Result<Vec<f32>, Error> {
    recursion(data, operation)
}

fn recursion(data: &Vec<Vec<f32>>, operation: &Operation) -> Result<Vec<f32>, Error> {
    match operation {
        Operation::Constant { gain, signal_id } => data
            .get(*signal_id as usize)
            .ok_or(Error::new(
                ErrorKind::Other,
                format!("This signal id does not exist {}", signal_id),
            ))
            // we transform the signal unit from uV to cm because the gain is in uV/cm
            .map((|data| data.into_iter().map(|v| v / gain).collect())),
        Operation::Composition {
            gain,
            ch1,
            ch2,
            operation,
        } => {
            let data_ch1 = recursion(data, &ch1)?;
            let data_ch2 = recursion(data, &ch2)?;

            match operation {
                OperationType::Add => Ok(data_ch1
                    .iter()
                    .zip(data_ch2.iter())
                    .map(|(v1, v2)| v1 + v2)
                    .collect()),
                OperationType::Minus => Ok(data_ch1
                    .iter()
                    .zip(data_ch2.iter())
                    .map(|(v1, v2)| v1 - v2)
                    .collect()),
            }
        }
    }
}
