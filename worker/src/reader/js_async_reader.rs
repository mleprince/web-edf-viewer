use edf_reader::file_reader::*;
use futures::{Async, Future, Poll};
use js_sys::Array;
use js_sys::ArrayBuffer;
use js_sys::Uint8Array;
use std::cell::RefCell;
use std::io::{Error, ErrorKind};
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen::UnwrapThrowExt;
use web_sys::Blob;
use web_sys::File;
use web_sys::FileReader;

pub struct JsAsyncReader {
    file: File,
}

impl JsAsyncReader {
    pub fn new(file: File) -> JsAsyncReader {
        JsAsyncReader { file }
    }
}

impl AsyncFileReader for JsAsyncReader {
    fn read_async(
        &self,
        offset: u64,
        length: u64,
    ) -> Box<Future<Item = Vec<u8>, Error = std::io::Error> + Send> {
        match FileFuture::new(&self.file, offset as usize, length as usize) {
            Ok(future) => Box::new(future),
            Err(e) => Box::new(futures::future::err(e)),
        }
    }
}

struct FileFuture {
    file_reader: FileReader,
    length: usize,
    onload: RefCell<Closure<Fn()>>,
    onerror: RefCell<Closure<Fn()>>,
}

unsafe impl Send for FileFuture {}

impl FileFuture {
    fn new(file: &File, offset: usize, length: usize) -> Result<FileFuture, Error> {
        let file_reader = FileReader::new().unwrap_throw();

        let slice: Blob = file
            .slice_with_i32_and_i32(offset as i32, (offset + length) as i32)
            .unwrap_throw();

        if let Err(e) = file_reader.read_as_array_buffer(&slice) {
            return Err(Error::new(ErrorKind::Other, "Failed to start FileReader"));
        }

        Ok(FileFuture {
            file_reader,
            length,
            onload: RefCell::new(Closure::wrap(Box::new(|| {}) as Box<Fn()>)),
            onerror: RefCell::new(Closure::wrap(Box::new(|| {}) as Box<Fn()>)),
        })
    }

    fn setup_callbacks(&mut self) {
        let success_notifier = futures::task::current();
        let error_notifier = success_notifier.clone();
        // If we're not ready set up onsuccess and onerror callbacks to notify the
        // executor.
        let onsuccess = Closure::wrap(Box::new(move || {
            success_notifier.notify();
        }) as Box<Fn()>);

        self.file_reader
            .set_onload(Some(onsuccess.as_ref().unchecked_ref()));

        self.onload.replace(onsuccess);

        let onerror = Closure::wrap(Box::new(move || {
            error_notifier.notify();
        }) as Box<Fn()>);
        self.file_reader
            .set_onerror(Some(&onerror.as_ref().unchecked_ref()));

        self.onerror.replace(onerror);
    }
}

impl Future for FileFuture {
    type Item = Vec<u8>;
    type Error = std::io::Error;

    fn poll(&mut self) -> Poll<Vec<u8>, Error> {
        // setup callbacks
        self.setup_callbacks();

        if self.file_reader.ready_state() == 2 {
            match self.file_reader.result() {
                Ok(js_value) => {
                    let array_buffer = ArrayBuffer::from(js_value);
                    let uint8_array = Uint8Array::new(&array_buffer);

                    /*
                    https://docs.rs/js-sys/0.3.19/js_sys/struct.Int8Array.html#method.copy_to
                    We use copy_to instead of view because errors may happen after.
                    */

                    let mut rust_array = vec![0; self.length];

                    uint8_array.copy_to(&mut rust_array[..]);

                    Ok(Async::Ready(rust_array))
                }
                Err(js_error) => Err(Error::new(ErrorKind::Other, "fail to read")),
            }
        } else {
            Ok(Async::NotReady)
        }
    }
}
