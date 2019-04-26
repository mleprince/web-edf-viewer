import * as worker from "../../edf-viewer-worker/pkg/edf_viewer_worker";

// let workerMemory: WebAssembly.Memory;

// export function getWorkerBuffer(): ArrayBuffer {
//     return workerMemory.buffer;
// }

// export class WasmArray {
//     public readonly pointer: number;
//     constructor(public readonly byteLength: number) {
//         this.pointer = worker.alloc(byteLength);
//     }

//     public getArray(): Uint8ClampedArray {
//         return new Uint8ClampedArray(workerMemory.buffer, this.pointer, this.byteLength);
//     }

//     public destroy() {
//         worker.dealloc(this.pointer, this.byteLength);
//     }
// }

export async function initWorker(): Promise<typeof worker> {
    return (<any>worker).default("./assembly/edf_viewer_worker_bg.wasm").then((result: any) => {
      //  workerMemory = result.memory;

        worker.init_error_panic();
        return worker;
    });
}
