import { EDFHeader } from "@/edfReader/edfReader";

export class Montage {

    constructor(
        public label: string,
        public channels: Array<Signal>
    ) { }

    public static getDefaultMontage(edfHeader: EDFHeader): Montage {

        const signalList: Array<Signal> = edfHeader.channels.map((edfChannel, i) => {
            const samplingRate = 1000 * edfChannel.number_of_samples_in_data_record / edfHeader.block_duration;

            const signal = new Signal(edfChannel.label, new ConstantOperation(i, -1), samplingRate);
            //   signal.filters.push({ type: FilterType.Lowpass, cutoffFreq: [40] });
            //  signal.filters.push({ type: FilterType.Lowpass, cutoffFreq: [40] });
            return signal;
        });

        return new Montage("default", signalList);
    }

    public toRustStruct(): any {
        return {
            label: this.label,
            channels: this.channels.map(channel => channel.toRustStruct())
        };
    }
}

export class Signal {
    constructor(
        public readonly label: string,
        public readonly operation: Operation,
        public readonly samplingRate: number,
    ) { }

    public toRustStruct(): any {

        const obj: any = {};

        obj[this.operation.type] = this.operation.getRustStruct();

        return {
            label: this.label,
            operation: obj
        };
    }
}

export abstract class Operation {
    constructor(public readonly type: "Constant" | "Composition") { }

    public abstract getRustStruct(): any;

}

export class ConstantOperation extends Operation {

    public getRustStruct() {
        return {
            signal_id: this.signalId,
            gain: this.gain
        };
    }

    constructor(
        public readonly signalId: number,
        public readonly gain: number
    ) {
        super("Constant");
    }
}

export enum OperationType {
    Add = "Add",
    Minus = "Minus"
}

export class CompositionOperation extends Operation {
    constructor(
        public readonly gain: number,
        public readonly ch1: Operation,
        public readonly ch2: Operation,
        public readonly operation: OperationType) {
        super("Composition");
    }

    public getRustStruct(): any {
        return {
            gain: this.gain,
            ch1: this.ch1.getRustStruct(),
            ch2: this.ch2.getRustStruct,
            operation: this.operation
        };
    }
}
