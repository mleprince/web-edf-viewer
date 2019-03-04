import { Montage, Signal } from './model/montage';
import { MontageService } from './service/montage/js.montage.service';
import { FilterService } from './service/filter/wsam.filter.service';

export class SignalTransformer {

    currentMontage: Montage;

    constructor(
        private filterService: FilterService,
        private montageService: MontageService

    ) {

        this.currentMontage = new Montage("", []);
    }

    getFinalSignal(rawData: Array<Float32Array>): Array<{ data: Float32Array, meta: Signal }> {

        return this.montageService
            .applyMontage(rawData, this.currentMontage)
            .map(displayedSignal => {
                return {
                    data: this.filterService.filterSignal(displayedSignal.data, displayedSignal.meta),
                    meta: displayedSignal.meta
                };
            })
    }
}