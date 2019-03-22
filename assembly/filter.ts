import "allocator/arena";

export function filter(
    outputCoeffOffset: i32,
    outputCoeffCount: i32,
    inputCoeffOffset: i32,
    inputCoeffCount: i32,
    arrayLength: i32,
    sourceArrayOffset: i32,
    destinationArrayOffset: i32
): void {


    let outputCoeffs: Float32Array = new Float32Array(inputCoeffCount);
    let inputCoeffs: Float32Array = new Float32Array(outputCoeffCount);

    for (let i = 0; i < outputCoeffCount; i++) {
        outputCoeffs[i] = load<f32>(outputCoeffOffset + 4 * i);
    }

    for (let i = 0; i < inputCoeffCount; i++) {
        inputCoeffs[i] = load<f32>(inputCoeffOffset + 4 * i);
    }

    inputCoeffCount = inputCoeffCount - 1;
    outputCoeffCount = outputCoeffCount - 1;

    let input: Float32Array = new Float32Array(inputCoeffCount);
    let output: Float32Array = new Float32Array(outputCoeffCount);

    let inputIdx: i32 = 0;
    let outputIdx: i32 = 0;

    for (let i: i32 = 0; i < arrayLength; i++) {

        let inputPoint: f32 = load<f32>(sourceArrayOffset + 4 * i);

        let acc: f32 = inputCoeffs[0] * inputPoint;

        for (let j: i32 = 1; j <= inputCoeffCount; j++) {
            let p: i32 = (inputIdx + inputCoeffCount - j) % inputCoeffCount;
            acc += inputCoeffs[j] * input[p]
        }
        for (let j: i32 = 1; j <= outputCoeffCount; j++) {
            let p: i32 = (outputIdx + outputCoeffCount - j) % outputCoeffCount;
            acc -= outputCoeffs[j] * output[p];
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

    memory.reset();
}
