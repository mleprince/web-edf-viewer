import { Montage, Signal } from "@/model/montage";
import FilterService from "./filter/filter.service";
import { MontageService } from "./montage/js.montage.service";

export default class SignalTransformer {

    constructor(
        private filterService: FilterService,
        private montageService: MontageService,
    ) { }

    public getFinalSignal(rawData: Array<Float32Array>, montage: Montage): Array<SignalData> {

        return this.montageService
            .applyMontage(rawData, montage)
            .map(displayedSignal => this.filterService.filterSignal(displayedSignal));
    }
}

export interface SignalData {
    meta: Signal;
    data: Float32Array;
}
