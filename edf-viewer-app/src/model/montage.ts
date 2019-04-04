import { EDFFile } from "@/edfReader/edfReader";

export class Montage {

    constructor(
        public label: string,
        public channels: Array<Signal>
    ) { }

    public static getDefaultMontage(edfFile: EDFFile): Montage {

        const signalList: Array<Signal> = edfFile.channels.map((edfChannel, i) => {
            const samplingRate = 1000 * edfChannel.number_of_samples_in_data_record / edfFile.header.block_duration;

            const signal = new Signal(edfChannel.label, new ConstantOperation(i, -1), samplingRate);
            //   signal.filters.push({ type: FilterType.Lowpass, cutoffFreq: [40] });
            //  signal.filters.push({ type: FilterType.Lowpass, cutoffFreq: [40] });
            return signal;
        });

        return new Montage("default", signalList);
    }
}

export enum FilterType {
    Lowpass,
    Highpass,
    Notch
}

export interface FilterDefinition {
    type: FilterType;
    cutoffFreq: Array<number>;
}

export class Signal {

    public readonly filters: Array<FilterDefinition> = [];

    constructor(
        public readonly label: string,
        public readonly operation: Operation,
        public readonly samplingRate: number
    ) {
    }
}

export class Operation {
    constructor(
        public readonly gain: number,
        public readonly type: "Constant" | "Composition"
    ) { }

}

export class ConstantOperation extends Operation {
    constructor(public readonly signal_id: number, gain: number) {
        super(gain, "Constant");
    }
}

export class CompositionOperation extends Operation {
    constructor(public readonly ch1: Operation, public readonly ch2: Operation, gain: number) {
        super(gain, "Composition");
    }
}

export class MinusOperation extends CompositionOperation { }
