extern crate serde;

use wasm_bindgen::prelude::*;

// Layer

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum Operation {
    Constant {
        gain: f32,
        signal_id: u8,
    },
    Composition {
        gain: f32,
        ch1: Box<Operation>,
        ch2: Box<Operation>,
        operation: OperationType,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum OperationType {
    Add,
    Minus,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FilterType {
    Notch,
    Lowpass,
    Highpass,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FilterDescription {
    pub filter_type: FilterType,
    pub freq: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Signal {
    pub operation: Operation,
    pub label: String,
    pub sampling_rate: f32,
    pub filter: Vec<FilterDescription>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Montage {
    pub signals: Vec<Signal>,
    pub label: String,
}
