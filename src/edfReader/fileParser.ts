
export class FileParser {

    private offset = 0;

    constructor(private rawData: ArrayBuffer) { }

    public readString(stringLength: number): string {
        const rawValue: ArrayBuffer = this.rawData.slice(this.offset, this.offset + stringLength);
        this.offset += stringLength;
        return new TextDecoder("utf-8").decode(rawValue);
    }

    public readInteger(stringLength: number): number {
        return parseInt(this.readString(stringLength), 10);
    }

    public moveOffset(moveOffset: number) {
        this.offset += moveOffset;
    }

    public readStringList(listLength: number, stringUnitLength: number): Array<string> {
        const array: Array<string> = [];

        for (let i = 0; i < listLength; i++) {
            array.push(this.readString(stringUnitLength));
        }

        return array;
    }

    public readNumberList(listLength: number, stringUnitLength: number): Array<number> {
        return this.readStringList(listLength, stringUnitLength).map(str => parseInt(str, 10));
    }
}
