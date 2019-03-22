import { FilterType } from "../../model/montage";
import { SignalData } from "../signalTransormer";

import Fili from "fili";

export default abstract class FilterService {

    protected abstract filter(data: Float32Array, coeffs: { input: Float32Array, output: Float32Array }): Float32Array;

    // TODO : returns reals coeffs :
    private getCoeffs(
        samplingRate: number,
        filterType: FilterType,
        cutoffFrequency: Array<number>,
    ): { input: Float32Array, output: Float32Array } {

        const iirCalculator: any = new Fili.CalcCascades();

        const cut = cutoffFrequency.length === 1 ? cutoffFrequency[0] : (cutoffFrequency[1] + cutoffFrequency[0]) / 2;

        const options = {
            order: 1, // cascade 3 biquad filters (max: 12)
            characteristic: "butterworth",
            Fs: samplingRate, // sampling frequency
            Fc: cut, // cutoff frequency / center frequency for bandpass, bandstop, peak
            BW: cutoffFrequency.length === 2 ? cutoffFrequency[1] - cutoffFrequency[0] : 1,
            // bandwidth only for bandstop and bandpass filters - optional
            gain: 0, // gain for peak, lowshelf and highshelf
            preGain: false // adds one constant multiplication for highpass and lowpass
            // k = (1 + cos(omega)) * 0.5 / k = 1 with preGain == false
        };

        let iirFilterCoeffs: any;

        if (filterType === FilterType.Highpass) {
            iirFilterCoeffs = iirCalculator.highpass(options);
        } else if (filterType === FilterType.Lowpass) {
            iirFilterCoeffs = iirCalculator.lowpass(options);
        } else {
            // notch
            iirFilterCoeffs = iirCalculator.bandstop(options);
        }

        const filters = {
            output: new Float32Array([1]
                .concat(iirFilterCoeffs[0].a.map((value: number) => value / iirFilterCoeffs[0].a0))),
            input: new Float32Array(iirFilterCoeffs[0].b.map((value: number) => value / iirFilterCoeffs[0].a0)),
        };

        return filters;
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
