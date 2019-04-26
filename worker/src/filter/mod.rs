use crate::montage::model::*;
use biquad::coefficients::Q_BUTTERWORTH;
use biquad::{Biquad, Coefficients, DirectForm2Transposed, Hertz, ToHertz, Type};

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! debug {
    ( $( $t:tt )* ) => {
        web_sys::console::debug_1(&format!( $( $t )* ).into());
    }
}

pub fn apply_filters(data: &Vec<f32>, signal: &Signal) -> Vec<f32> {
    let mut input_array: Vec<f32> = data.clone();
    let mut output_array: Vec<f32> = data.clone();


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

    input_array
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
