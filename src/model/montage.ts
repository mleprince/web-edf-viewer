import { FilterType } from "../service/filter/wsam.filter.service";

export class Montage {

    constructor(
        public label: string,
        public channels: Array<Signal>
    ) { }
}


export interface FilterDefinition {
    type: FilterType,
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
        super(gain)
    }
}

export class MinusOperation extends AddOperation { }
