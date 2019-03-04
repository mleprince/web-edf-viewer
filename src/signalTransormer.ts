export class SignalTransformer {


    /**
     * The buffer has this form :
     * length ch1 + points ch1
     */

    constructor() {


        var memory = new WebAssembly.Memory({
            initial: 1000
        });
        const wasmBuffer = memory.buffer;

        const array: Float32Array = new Float32Array(10);

        for (let i = 0; i < array.length; i++) {
            array[i] = i;
        }

        var imports = {
            env: {
                memory
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

                const wasmModule = resultObject.instance.exports;

                const wasmSourceArray = new Float32Array(wasmBuffer, 0, array.length);

                const wasmResultArray = new Float32Array(wasmBuffer, array.length * 4, array.length);

                wasmSourceArray.set(array);

                wasmModule.gain(0, array.length, array.length * 4, 2);

                console.log(wasmResultArray);
                console.log(wasmSourceArray);
            })
        })


    }


}