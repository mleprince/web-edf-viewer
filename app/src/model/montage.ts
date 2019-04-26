import { EDFHeader } from "./edfHeader";
import AppConstants from "@/constants";

export class Montage implements RustSerializable {

    constructor(
        public label: string,
        public signals: Array<Signal>
    ) { }

    public static getDefaultMontage(edfHeader: EDFHeader): Montage {

        const signalList: Array<Signal> = edfHeader.channels
            .filter(channel => channel.label !== "EDF Annotations")
            .map((edfChannel, i) => {
                const samplingRate = 1000 * edfChannel.number_of_samples_in_data_record / edfHeader.block_duration;

                const signal = new Signal(
                    edfChannel.label,
                    new ConstantOperation(i, AppConstants.defaultGain),
                    samplingRate, []);

                AppConstants.defaultFilters
                    .forEach(filter => {
                        if (filter[1] !== null) {
                            signal.filter.push(new FilterDescription(filter[0] as FilterType, filter[1]));
                        }
                    });

                return signal;
            });

        return new Montage("default", signalList);
    }

    public toWasmStruct(): any {
        return {
            label: this.label,
            signals: this.signals.map(signal => signal.toWasmStruct())
        };
    }

    public updateFilters(filterType: FilterType, newValue: number | null) {
        this.signals.forEach(signal => {

            const oldValueIndex = signal.filter
                .findIndex(filterDescription => filterDescription.filterType === filterType);

            if (oldValueIndex > -1) {
                signal.filter.splice(oldValueIndex, 1);
            }

            if (newValue !== null) {
                signal.filter.push(new FilterDescription(filterType, newValue));
            }

        });
    }

    public updateGain(newValue: number) {
        this.signals.forEach(signal => signal.operation.gain = newValue);
    }
}

export enum FilterType {
    Notch = "Notch",
    Highpass = "Highpass",
    Lowpass = "Lowpass"
}

export class FilterDescription implements RustSerializable {
    constructor(
        public readonly filterType: FilterType,
        public readonly freq: number) {

    }

    public toWasmStruct(): any {
        return {
            filter_type: this.filterType,
            freq: this.freq,
        };
    }
}

/**
 * The object in Wasm is in snake_case instead of camelCase ( convention of Rust language)
 */
interface RustSerializable {
    toWasmStruct(): any;
}

export class Signal implements RustSerializable {
    constructor(
        public readonly label: string,
        public readonly operation: Operation,
        public readonly samplingRate: number,
        public readonly filter: Array<FilterDescription>
    ) { }

    public toWasmStruct(): any {

        const obj: any = {};

        obj[this.operation.type] = this.operation.toWasmStruct();

        return {
            label: this.label,
            operation: obj,
            sampling_rate: this.samplingRate,
            filter: this.filter.map(filterDescription => filterDescription.toWasmStruct())
        };
    }
}

export abstract class Operation implements RustSerializable {
    constructor(public readonly type: "Constant" | "Composition", public gain: number) { }

    public abstract toWasmStruct(): any;
}

export class ConstantOperation extends Operation {

    public toWasmStruct() {
        return {
            signal_id: this.signalId,
            gain: this.gain
        };
    }

    constructor(
        public readonly signalId: number,
        gain: number
    ) {
        super("Constant", gain);
    }
}

export enum OperationType {
    Add = "Add",
    Minus = "Minus"
}

export class CompositionOperation extends Operation {
    constructor(
        gain: number,
        public readonly ch1: Operation,
        public readonly ch2: Operation,
        public readonly operation: OperationType) {
        super("Composition", gain);
    }

    public toWasmStruct(): any {
        return {
            gain: this.gain,
            ch1: this.ch1.toWasmStruct(),
            ch2: this.ch2.toWasmStruct(),
            operation: this.operation
        };
    }
}
