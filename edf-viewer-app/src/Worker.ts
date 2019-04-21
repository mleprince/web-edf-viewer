import * as worker from "../public/assembly/edf_viewer_worker";

let workerMemory: WebAssembly.Memory;

interface Operation {
    type: "Constant" | "Composition";
}

interface ConstantOperation extends Operation {
    signal_id: number;
}

interface CompositionOperation extends Operation {
    elements: Array<Operation>;
}

interface Signal {
    operation: Operation;
    label: string;
}
interface Montage {
    label: string;
    channels: Array<Signal>;
}

export function getWorkerBuffer(): ArrayBuffer {
    return workerMemory.buffer;
}

export class WasmArray {
    public readonly pointer: number;
    constructor(public readonly byteLength: number) {
        this.pointer = worker.alloc(byteLength);
    }

    public getArray(): Uint8ClampedArray {
        return new Uint8ClampedArray(workerMemory.buffer, this.pointer, this.byteLength);
    }

    public destroy() {
        worker.dealloc(this.pointer, this.byteLength);
    }
}

export async function initWorker(): Promise<typeof worker> {
    return (<any>worker).default("./assembly/edf_viewer_worker_bg.wasm").then((result: any) => {
        workerMemory = result.memory;

        worker.init_error_panic();
        return worker;
    });
}
