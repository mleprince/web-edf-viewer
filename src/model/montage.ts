import { EDFFile } from "@/edfReader/edfReader";

export class Montage {

    constructor(
        public label: string,
        public channels: Array<Signal>
    ) { }

    public static getDefaultMontage(edfFile: EDFFile): Montage {

        const signalList: Array<Signal> = edfFile.channels.map((edfChannel, i) => {
            const samplingRate = 1000 * edfChannel.numberOfSamplesInDataRecord / edfFile.header.blockDuration;

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
    constructor(public readonly gain: number) { }

}

export class ConstantOperation extends Operation {
    constructor(public readonly idChannel: number, gain: number) {
        super(gain);
    }
}

export class AddOperation extends Operation {
    constructor(public readonly ch1: Operation, public readonly ch2: Operation, gain: number) {
        super(gain);
    }
}

export class MinusOperation extends AddOperation { }
