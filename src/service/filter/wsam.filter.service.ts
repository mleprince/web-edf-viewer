import { Signal } from './../../model/montage';

export interface FilterService {
    filterSignal(data: Float32Array, signal: Signal): Float32Array;
}

export class WebAssemblyFilterService implements FilterService {

    wasmModule: any;

    wasmBuffer: ArrayBuffer;

    isInitiated = false;

    constructor() {

        // 640kb => I think it is enough
        //  TODO : optim memory consumption
        var memory = new WebAssembly.Memory({
            initial: 10
        });

        this.wasmBuffer = memory.buffer;

        var imports = {
            module: {},
            env: {
                memory: memory,
                table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
                abort(msgPtr: number, filePtr: number, line: number, column: number) {
                    throw new Error(`index.ts: abort at [line  ${line} / column ${column}]`);
                }
            },
            // Debug functions
            console: {
                logInt(idx: number, val: number) {
                    console.log("logInt idx : " + idx + "  val : " + val);
                },
                logFloat(idx: number, val: number) {
                    console.log("logFloat idx : " + idx + "  val : " + val);
                },
            }
        };

        fetch("./build/untouched.wasm").then(result => result.arrayBuffer()).then(arrayBuffer => {
            WebAssembly.instantiate(arrayBuffer, imports).then(resultObject => {

                this.wasmModule = resultObject.instance.exports;
                this.isInitiated = true;

            })
        });
    }

    filterSignal(data: Float32Array, signal: Signal): Float32Array {

        let result: Float32Array = data;

        signal.filters.forEach(filter => {
            result = this.filter(result, signal.samplingRate, filter.type, filter.cutoffFreq);
        })

        return result;
    }

    private filter(data: Float32Array, samplingRate: number, filterType: FilterType, cutoffFrequency: Array<number>): Float32Array {

        if (!this.isInitiated) {
            throw Error("The Service has not yes been initiated");
        }

        const coeffs = this.getCoeffs(samplingRate, filterType, cutoffFrequency);

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
            wasmResultArrayOffset
        );

        // TODO : See how we can avoid that copy
        return new Float32Array(wasmResultArray); //  we do that because the buffer will be reused 
    }

    // TODO : returns reals coeffs : 
    getCoeffs(samplingRate: number, filterType: FilterType, cutoffFrequency: Array<number>): { input: Float32Array, output: Float32Array } {
        return {
            input: new Float32Array([1.0, -0.7215530376607511, 0.2651579179333694]),
            output: new Float32Array([0.13590122006815455, 0.2718024401363091, 0.13590122006815455])
        };
    }
}


export enum FilterType {
    Lowpass,
    Highpass,
    Notch
}
