/**
 * Old code kept for info
 */

// In order to work with the memory we expose (de)allocation methods
#[no_mangle]
#[wasm_bindgen]
pub extern "C" fn alloc(size: usize) -> *mut c_void {
    utils::set_panic_hook();
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    return ptr as *mut c_void;
}

#[no_mangle]
#[wasm_bindgen]
pub extern "C" fn dealloc(ptr: *mut c_void, cap: usize) {
    unsafe {
        let _buf = Vec::from_raw_parts(ptr, 0, cap);
    }
}


#[wasm_bindgen]
pub fn compute(result_pointer: *mut u8, width: usize, height: usize) {
    let length = width * height;

    let result = unsafe { slice::from_raw_parts_mut(result_pointer, length) };

    let mut j = 0;
    for i in 0..800000 {
        result[i] = i as u8;
    }
}