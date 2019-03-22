import FilterService from "./filter.service";

export default class WebAssemblyFilterService extends FilterService {

    private wasmModule: any;

    private wasmBuffer: ArrayBuffer;

    private isInitiated = false;

    constructor() {
        super();

        // 640kb => I think it is enough
        //  TODO : optim memory consumption
        const memory = new WebAssembly.Memory({
            initial: 10,
        });

        this.wasmBuffer = memory.buffer;

        const imports = {
            module: {},
            env: {
                memory,
                table: new WebAssembly.Table({ initial: 0, element: "anyfunc" }),
                abort(msgPtr: number, filePtr: number, line: number, column: number) {
                    throw new Error(`index.ts: abort at [line  ${line} / column ${column}]`);
                },
            },
            // Debug functions
            console: {
                logInt(idx: number, val: number) {
                    console.log("logInt idx : " + idx + "  val : " + val);
                },
                logFloat(idx: number, val: number) {
                    console.log("logFloat idx : " + idx + "  val : " + val);
                },
            },
        };

        (<any>WebAssembly).instantiateStreaming(fetch("wasm/optimized.wasm"), imports).then((resultObject: any) => {

            this.wasmModule = resultObject.instance.exports;
            this.isInitiated = true;

        });

    }

    protected filter(data: Float32Array, coeffs: { input: Float32Array, output: Float32Array }): Float32Array {

        if (!this.isInitiated) {
            throw Error("The Service has not yes been initiated");
        }

        const wasmOutputCoeffOffset = 0;
        const wasmOutputCoeff = new Float32Array(this.wasmBuffer, wasmOutputCoeffOffset, coeffs.output.length);
        wasmOutputCoeff.set(coeffs.output);

        const wasmInputCoeffOffset = wasmOutputCoeff.length * 4;
        const wasmInputCoeff = new Float32Array(this.wasmBuffer, wasmInputCoeffOffset, coeffs.input.length);
        wasmInputCoeff.set(coeffs.input);

        const wasmSourceArrayOffset = wasmInputCoeffOffset + wasmInputCoeff.length * 4;
        const wasmSourceArray = new Float32Array(this.wasmBuffer, wasmSourceArrayOffset, data.length);
        wasmSourceArray.set(data);

        const wasmResultArrayOffset = wasmSourceArrayOffset + data.length * 4;
        const wasmResultArray = new Float32Array(this.wasmBuffer, wasmResultArrayOffset, data.length);

        this.wasmModule.filter(
            wasmOutputCoeffOffset,
            coeffs.output.length,
            wasmInputCoeffOffset,
            coeffs.input.length,
            data.length,
            wasmSourceArrayOffset,
            wasmResultArrayOffset,
        );

        // TODO : See how we can avoid that copy
        return new Float32Array(wasmResultArray); //  we do that because the buffer will be reused
    }
}
