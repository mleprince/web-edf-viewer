import * as worker from "../../worker/pkg/edf_viewer_worker";

export async function initWorker(): Promise<typeof worker> {
    return (<any>worker).default("./assembly/edf_viewer_worker_bg.wasm").then((_: any) => {
      //  workerMemory = result.memory;

        worker.init_error_panic();
        return worker;
    });
}
