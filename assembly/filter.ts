import "allocator/tlsf";

export function filter(
    outputOffset: i32,
    outputCoeffCount: i32,
    inputOffset: i32,
    inputCoeffCount: i32,
    arrayLength: i32,
    sourceArrayOffset: i32,
    destinationArrayOffset: i32
): void {

    let inputCoeffList: Float32Array = new Float32Array(inputCoeffCount);
    let ouputCoeffList: Float32Array = new Float32Array(outputCoeffCount);

    for (let i = 0; i < outputCoeffCount; i++) {
        ouputCoeffList[i] = load<f32>((outputOffset + 4 * i));
    }
    for (let i = 0; i < inputCoeffCount; i++) {
        inputCoeffList[i] = load<f32>((inputOffset + 4 * i));
    }


    inputCoeffCount = inputCoeffCount - 1;
    outputCoeffCount = outputCoeffCount - 1;

    let input: Float32Array = new Float32Array(inputCoeffCount);
    let output: Float32Array = new Float32Array(outputCoeffCount);

    let inputIdx: i32 = 0;
    let outputIdx: i32 = 0;

    for (let i: i32 = 0; i < arrayLength; i++) {

        let inputPoint: f32 = load<f32>((sourceArrayOffset + 4 * i));

        let acc: f32 = inputCoeffList[0] * inputPoint;

        for (let j: i32 = 1; j <= inputCoeffCount; j++) {
            let p: i32 = (inputIdx + inputCoeffCount - j) % inputCoeffCount;
            acc += inputCoeffList[j] * input[p]
        }
        for (let j: i32 = 1; j <= outputCoeffCount; j++) {
            let p: i32 = (outputIdx + outputCoeffCount - j) % outputCoeffCount;
            acc -= ouputCoeffList[j] * output[p];
        }
        if (inputCoeffCount > 0) {
            input[inputIdx] = inputPoint;
            inputIdx = (inputIdx + 1) % inputCoeffCount;
        }
        if (outputCoeffCount > 0) {
            output[outputIdx] = acc;
            outputIdx = (outputIdx + 1) % outputCoeffCount;
        }

        store<f32>(destinationArrayOffset + 4 * i, acc);
    }
}


// Imported debug functions  
declare namespace console {
    @external("console", "logInt") function logInt(idx: u32, val: u32): void;
    @external("console", "logFloat") function logFloat(idx: u32, val: f32): void;
}
