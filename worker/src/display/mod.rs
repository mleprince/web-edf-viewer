use crate::montage_service::model::Signal;
use std::mem;
use std::os::raw::c_void;
use std::slice;

use line_drawing::Bresenham;
use line_drawing::XiaolinWu;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! debug {
    ( $( $t:tt )* ) => {
        web_sys::console::debug_1(&format!( $( $t )* ).into());
    }
}

#[derive(Clone, Copy, Debug)]
pub enum RenderingType {
    Point,
    Line,
    LineWithAntialiasing,
}

pub struct PixelMatrix {
    width: u32,
    height: u32,
    data: Vec<Vec<f32>>,
    draw: Box<FnMut(&[f32], f32, &mut Vec<u8>)>,
}

impl<'a> PixelMatrix {
    pub fn new(
        width: u32,
        height: u32,
        data: Vec<Vec<f32>>,
        rendering_type: RenderingType,
    ) -> PixelMatrix {
        debug!(
            "Create pixel matrix with (width : {},height : {})",
            width, height
        );

        PixelMatrix {
            width,
            height,
            data,
            draw: PixelMatrix::get_draw_function(rendering_type, height, width),
        }
    }

    pub fn compute(&mut self) -> Vec<u8> {
        let mut result = vec![0; (4 * self.width * self.height) as usize];

        for (i, signal_data) in self.data.iter().enumerate() {
            let offset: f32 = (i as f32 + 0.5) * self.height as f32 / self.data.len() as f32;

            (self.draw)(signal_data, offset, &mut result);
        }

        result
    }

    #[inline]
    fn get_coord(
        point: f32,
        offset: f32,
        index: f32,
        width: f32,
        signal_data_length: f32,
    ) -> (isize, isize) {
        (
            (width * (index / signal_data_length)) as isize,
            (offset + point) as isize,
        )
    }

    fn get_draw_function(
        rendering_type: RenderingType,
        height: u32,
        width: u32,
    ) -> Box<FnMut(&[f32], f32, &mut Vec<u8>) -> ()> {
        match rendering_type {
            // We draw only the points
            RenderingType::Point => Box::new(move |data, offset, result| {
                for i in 0..data.len() {
                    let (x, y) = PixelMatrix::get_coord(
                        data[i],
                        offset,
                        i as f32,
                        width as f32,
                        data.len() as f32,
                    );

                    if y >= 0 && y < height as isize {
                        let index: usize = 4 * (y * width as isize + x) as usize;
                        result[index] = 0;
                        result[index + 1] = 0;
                        result[index + 2] = 0;
                        result[index + 3] = 255;
                    }
                }
            }),
            // We draw the lines without anti-aliasing
            RenderingType::Line => Box::new(move |data, offset, result| {
                for i in 1..data.len() {
                    let first_coord = PixelMatrix::get_coord(
                        data[i - 1],
                        offset,
                        (i - 1) as f32,
                        width as f32,
                        data.len() as f32,
                    );

                    let second_coord = PixelMatrix::get_coord(
                        data[i],
                        offset,
                        i as f32,
                        width as f32,
                        data.len() as f32,
                    );

                    for (x, y) in Bresenham::new(first_coord, second_coord) {
                        if (y >= 0 && y < height as isize) {
                            let index: usize = 4 * (y * width as isize + x) as usize;
                            result[index] = 0;
                            result[index + 1] = 0;
                            result[index + 2] = 0;
                            result[index + 3] = 255;
                        }
                    }
                }
            }),
            RenderingType::LineWithAntialiasing => Box::new(move |data, offset, result| {
                let first_cord: (isize, isize) =
                    PixelMatrix::get_coord(data[0], offset, 0.0, width as f32, data.len() as f32);

                let mut last_coord: (f32, f32) = (first_cord.0 as f32, first_cord.1 as f32);

                for i in 1..data.len() {
                    let coord = PixelMatrix::get_coord(
                        data[i],
                        offset,
                        (i) as f32,
                        width as f32,
                        data.len() as f32,
                    );

                    let f32_coord = (coord.0 as f32, coord.1 as f32);

                    for ((x, y), opacity) in XiaolinWu::<f32, isize>::new(last_coord, f32_coord) {
                        if (y >= 0 && y <= height as isize) {
                            let index: usize = 4 * (y * width as isize + x) as usize;

                            if result[index + 3] == 0 {
                                result[index] = 0;
                                result[index + 1] = 0;
                                result[index + 2] = 0;
                                result[index + 3] = (opacity * 255.0) as u8;
                            }
                        }
                    }

                    last_coord = f32_coord;
                }
            }),
        }
    }
}
