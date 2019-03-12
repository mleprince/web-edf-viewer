import FilterService from "./filter.service";

export default class JsFilterService extends FilterService {

    protected filter(data: Float32Array, coeffs: { input: Float32Array, output: Float32Array }): Float32Array {

        const inputCoeffCount = coeffs.input.length - 1;
        const outputCoeffCount = coeffs.output.length - 1;

        const input: Float32Array = new Float32Array(inputCoeffCount);
        const output: Float32Array = new Float32Array(outputCoeffCount);

        let inputIdx: number = 0;
        let outputIdx: number = 0;

        const result = new Float32Array(data.length);

        for (let i: number = 0; i < data.length; i++) {

            let acc: number = coeffs.input[0] * data[i];

            for (let j: number = 1; j <= inputCoeffCount; j++) {
                const p: number = (inputIdx + inputCoeffCount - j) % inputCoeffCount;
                acc += coeffs.input[j] * input[p];
            }
            for (let j: number = 1; j <= outputCoeffCount; j++) {
                const p: number = (outputIdx + outputCoeffCount - j) % outputCoeffCount;
                acc -= coeffs.output[j] * output[p];
            }
            if (inputCoeffCount > 0) {
                input[inputIdx] = data[i];
                inputIdx = (inputIdx + 1) % inputCoeffCount;
            }
            if (outputCoeffCount > 0) {
                output[outputIdx] = acc;
                outputIdx = (outputIdx + 1) % outputCoeffCount;
            }

            result[i] = acc;
        }

        return result;
    }

}
