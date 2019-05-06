use crate::montage_service::model::*;
use biquad::coefficients::Q_BUTTERWORTH;
use biquad::{Biquad, Coefficients, DirectForm2Transposed, Hertz, ToHertz, Type};

use std::cmp::min;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! debug {
    ( $( $t:tt )* ) => {
        web_sys::console::debug_1(&format!( $( $t )* ).into());
    }
}

fn get_input(data: &[f32]) -> (Vec<f32>, usize) {
    // we add max 50 points before the window to delete the transcient response of the filter.
    // These 50 points are the first 50 points of the signal which are reversed ( to preserve the continuity)
    // TODO : if window is really small, the transcient response can be still here.

    let number_of_points_to_prefix = std::cmp::min((0.1 * data.len() as f32) as usize, 50);

    let mut input_array: Vec<f32> = vec![0.0; data.len() + number_of_points_to_prefix];

    for i in 0..number_of_points_to_prefix {
        input_array[i] = data[number_of_points_to_prefix - i];
    }

    for i in 0..data.len() {
        input_array[i + number_of_points_to_prefix] = data[i];
    }

    (input_array, number_of_points_to_prefix)
}

pub fn apply_filters(data: &[f32], signal: &Signal) -> Vec<f32> {

    let (mut input_array, number_of_points_to_prefix) = get_input(data);
    let mut output_array: Vec<f32> = input_array.clone();

    for filter_description in &signal.filter {
        if check_nyquist(signal.sampling_rate, filter_description.freq) {
            continue;
        }

        filter_data(
            get_filter(filter_description, signal.sampling_rate),
            &input_array,
            &mut output_array,
        );

        // swap input and output arrays
        std::mem::swap(&mut input_array, &mut output_array);
    }

    input_array.split_off(number_of_points_to_prefix)
}

fn check_nyquist(sampling_rate: f32, freq: f32) -> bool {
    return freq * 2.0 >= sampling_rate;
}

fn filter_data(mut filter: impl Biquad, input: &Vec<f32>, output: &mut Vec<f32>) {
    for i in 0..input.len() {
        output[i] = filter.run(input[i]);
    }
}

fn get_filter(filter_description: &FilterDescription, sampling_rate: f32) -> impl Biquad {
    let biquad_filter_type: Type = match filter_description.filter_type {
        FilterType::Highpass => Type::HighPass,
        FilterType::Lowpass => Type::LowPass,
        FilterType::Notch => Type::Notch,
    };

    let coeffs = Coefficients::from_params(
        biquad_filter_type,
        sampling_rate.hz(),
        filter_description.freq.hz(),
        Q_BUTTERWORTH,
    )
    .unwrap();

    DirectForm2Transposed::new(coeffs)
}
