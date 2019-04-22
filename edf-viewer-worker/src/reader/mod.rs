mod js_async_reader;

use edf_reader::async_reader::*;
use edf_reader::model::*;
use std::rc::Rc;

use futures::future::{err, Future};

use web_sys::File;

use js_async_reader::*;

use std::io::{Error, ErrorKind};

static mut EDF_READER: Option<AsyncEDFReader<JsAsyncReader>> = None;

// TODO : remove clone
pub fn get_header() -> Result<&'static EDFHeader, std::io::Error> {
    unsafe {
        match &EDF_READER {
            Some(edf_reader) => Ok(&edf_reader.edf_header),
            None => Err(Error::new(ErrorKind::Other, "Ready has not been initiated")),
        }
    }
}

pub fn init(file: File) -> impl Future<Item = EDFHeader, Error = Error> {
    let file_reader = JsAsyncReader::new(file);

    AsyncEDFReader::init_with_file_reader(file_reader).map(
        |edf_reader: AsyncEDFReader<JsAsyncReader>| {
            let header = edf_reader.edf_header.clone();
            unsafe {
                EDF_READER = Some(edf_reader);
            }

            header
        },
    )
}

pub fn read_window(
    start_time: u32,
    duration: u32,
) -> impl Future<Item = Vec<Vec<f32>>, Error = Error> {
    unsafe {
        match &EDF_READER {
            Some(edf_reader) => edf_reader.read_data_window(start_time as u64, duration as u64),
            None => Box::new(err(Error::new(
                ErrorKind::NotFound,
                "EDF Reader has not been initiated",
            ))),
        }
    }
}
