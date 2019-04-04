extern crate serde;

use wasm_bindgen::prelude::*;

// Layer

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum Operation {
    Constant {
        gain: f32,
        signal_id: u8,
    },
    Composition {
        gain: f32,
        ch1: usize,
        ch2: usize,
        operation: OperationType,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub enum OperationType {
    Add,
    Minus,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Signal {
    pub operation: Operation,
    pub label: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Montage {
    pub channels: Vec<Signal>,
    pub label: String,
}
