import { FilterType } from "../../model/montage";
import { SignalData } from "../signalTransormer";

export default abstract class FilterService {

    protected abstract filter(data: Float32Array, coeffs: { input: Float32Array, output: Float32Array }): Float32Array;

    // TODO : returns reals coeffs :
    private getCoeffs(
        samplingRate: number,
        filterType: FilterType,
        cutoffFrequency: Array<number>,
    ): { input: Float32Array, output: Float32Array } {
        return {
            input: new Float32Array([1.0, -0.7215530376607511, 0.2651579179333694]),
            output: new Float32Array([0.13590122006815455, 0.2718024401363091, 0.13590122006815455]),
        };
    }

    public filterSignal(signalData: SignalData): SignalData {

        console.debug("Filter Signal");
        let result: Float32Array = signalData.data;

        signalData.meta.filters.forEach(filter => {
            result = this.filter(result, this.getCoeffs(signalData.meta.samplingRate, filter.type, filter.cutoffFreq));
        });

        return {
            meta: signalData.meta,
            data: result,
        };
    }
}
