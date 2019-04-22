use crate::montage::model::*;
use biquad::coefficients::Q_BUTTERWORTH;
use biquad::{Biquad, Coefficients, DirectForm2Transposed, Hertz, ToHertz, Type};

pub fn apply_filters(data: &Vec<f32>, signal: &Signal) -> Vec<f32> {
    let mut input_array: Vec<f32> = data.clone();
    let mut output_array: Vec<f32> = vec![0 as f32; input_array.len()];

    let mut input_pointer = &mut input_array;
    let mut output_pointer = &mut output_array;

    for filter_description in &signal.filter {
       // we filter and put filterd points in output_array

        filter_data(
            get_filter(filter_description, signal.sampling_rate),
            input_pointer,
            output_pointer,
        );

       // swap input and output arrays

        input_pointer = &mut output_array;
        output_pointer = &mut input_array;
    }

    output_array
}

fn filter_data(mut filter: impl Biquad, input: &[f32], output: &mut [f32]) {
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
        filter_description.freq1.hz(),
        Q_BUTTERWORTH,
    )
    .unwrap();

    DirectForm2Transposed::new(coeffs)
}
