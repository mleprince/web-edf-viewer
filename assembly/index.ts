// The entry file of your WebAssembly module.

export function add(a: i32, b: i32): i32 {
  return a + b;
}

export function gain(sourceOffset: i32, sourceLength: i32, resultOffset: i32, gain: i32) : void {
  for (let i: i32 = 0; i < sourceLength; i++) {
    console.logInt(i,sourceOffset + 4 * i)
    load<f32>(sourceOffset + 4 * i) 
  //  store<f32>(resultOffset + 4 * i, load<f32>(sourceOffset + 4 * i) * <f32>gain);
  }
}


// Imported debug functions  
declare namespace console {  
  function logInt(idx: u32, val: u32): void;
  function logFloat(idx: u32, val: f32): void;
}
