import { Montage, Operation, ConstantOperation, AddOperation, MinusOperation } from './../../model/montage';
import { Signal } from "../../model/montage";

export interface MontageService {
    applyMontage(rawData: Array<Float32Array>, montage: Montage): Array<{ data: Float32Array, meta: Signal }>
}

export class JsMontageService implements MontageService {

    applyMontage(rawData: Array<Float32Array>, montage: Montage): Array<{ data: Float32Array; meta: Signal; }> {
        return montage.channels.map(channel => {
            return {
                data: this.recursion(rawData, channel.operation),
                meta: channel
            }

        })
    }

    recursion(data: Array<Float32Array>, operation: Operation): Float32Array {
        if (operation instanceof ConstantOperation) {
            return data[operation.idChannel].map(value => value * operation.gain);
        }
        else if (operation instanceof MinusOperation || operation instanceof AddOperation) {

            const dataCh1: Float32Array = this.recursion(data, operation.ch1);
            const dataCh2: Float32Array = this.recursion(data, operation.ch2);

            if (dataCh1.length != dataCh2.length) {
                throw Error("Wrong Operation " + operation);
            }

            if (operation instanceof MinusOperation) {
                for (let i = 0; i < dataCh1.length; i++) {
                    dataCh1[i] -= dataCh2[i];
                }
            } else {
                for (let i = 0; i < dataCh1.length; i++) {
                    dataCh1[i] += dataCh2[i];
                }
            }

            return dataCh1;
        } else {
            throw new Error("Unknown Operation type " + operation);
        }
    }
}