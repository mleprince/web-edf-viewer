import { PromiseFileReader } from './PromiseFileReader';

export class EDFFile {

    private constructor(
        public readonly header: EDFHeader,
        public readonly channels: Array<EDFChannel> = [],
        private file: File
    ) { }

    public static open(file: File): Promise<EDFFile> {

        return PromiseFileReader
            .open(file.slice(0, 256))   // We first read the first 256 bytes of the header which contains general infos
            .then(rawHeader => {
                const edfHeader = new EDFHeader(rawHeader);

                // we read the channelHeaders 

                return PromiseFileReader.open(file.slice(256, 256 + edfHeader.numberOfSignals * 256)).then(raw => {

                    const channelHeaderList = EDFChannel.readChannelList(raw, edfHeader.numberOfSignals);

                    return new EDFFile(edfHeader, channelHeaderList, file);
                })
            });
    }


    /**
     * Get a window of points
     * @param startTime  : in mS
     * @param duration : is mS
     */
    public getWindow(startTime: number, duration: number): Promise<Array<Array<number>>> {

        return new Promise((resolve, reject) => {

            const endTime = startTime + duration;

            if (this.checkBounds(startTime, duration)) {
                reject("Window out of bounds");
            };

            // calculate the corresponding blocks to get 

            const firstBlockStartTime = (startTime - startTime % this.header.blockDuration);

            const firstBlockIndex = firstBlockStartTime / this.header.blockDuration;

            const numberOfBlocksToGet = Math.ceil(duration / this.header.blockDuration);

            const lastBlockEndTime = (firstBlockIndex + numberOfBlocksToGet) * this.header.blockDuration;

            const offsetInFile = this.header.byteSizeHeader + firstBlockIndex * this.getSizeOfDataBlock();

            const lastOffsetInFile = offsetInFile + numberOfBlocksToGet * this.getSizeOfDataBlock();

            const fileReader = new FileReader();


            fileReader.onerror = error => reject(error);
            fileReader.onloadend = () => {

                const raw: ArrayBuffer = <ArrayBuffer>fileReader.result;

                console.log("file size : " + raw.byteLength);

                const array = new Uint16Array(raw);

                const result: Array<Array<number>> = [];

                this.channels.forEach((channel, i) => {

                    const channelData = [];

                    const numberOfPoints = numberOfBlocksToGet * channel.numberOfSamplesInDataRecord;

                    for (let j = 0; j < numberOfPoints; j++) {
                        channelData.push(array[i + this.channels.length * j])
                    }

                    // cut before and after

                    const frequency = channel.numberOfSamplesInDataRecord / this.header.blockDuration;

                    const before = (startTime - firstBlockStartTime) * frequency;

                    const after = (lastBlockEndTime - endTime) * frequency;

                    result.push(channelData.slice(before, channelData.length - after));
                });


                resolve(result);
            }

            fileReader.readAsArrayBuffer(this.file.slice(offsetInFile, lastOffsetInFile));
        });
    }

    checkBounds(startTime: number, duration: number): boolean {
        return false;
    }

    getSizeOfDataBlock() {
        let size = 0;

        this.channels.forEach(channel => {
            size += channel.numberOfSamplesInDataRecord * 2; // sample encoded in uint16
        });

        return size;
    }
}

export class EDFHeader {

    readonly fileVersion: string; // 8 ascii
    readonly localPatientIdentification: string; // 80 ascii
    readonly localRecordingIdentification: string; // 80 ascii
    readonly startDate: string; // 8 ascii
    readonly startTime: string; // 8 ascii

    readonly recordStartTime: number;

    readonly byteSizeHeader: number; // 8 ascii
    readonly numberOfBlocks: number; // 8 ascii
    readonly blockDuration: number; // 8 ascii
    readonly numberOfSignals: number; // 4 ascii

    constructor(raw: ArrayBuffer) {

        const fileParser = new FileParser(raw);

        this.fileVersion = fileParser.readString(8);
        this.localPatientIdentification = fileParser.readString(80);
        this.localRecordingIdentification = fileParser.readString(80);
        this.startDate = fileParser.readString(8);
        this.startTime = fileParser.readString(8);

        if (this.startDate != "" && this.startTime != "") {
            const splittedDate: Array<number> = this.startDate.split(".").map(str => parseInt(str));
            const splittedTime: Array<number> = this.startTime.split(".").map(str => parseInt(str));

            this.recordStartTime = Date.UTC(
                splittedDate[2],
                splittedDate[1] - 1,
                splittedDate[0],
                splittedTime[0],
                splittedTime[1],
                splittedTime[2]
            )
        }
        else {
            this.recordStartTime = 0;
        }

        this.byteSizeHeader = fileParser.readInteger(8);
        fileParser.moveOffset(44);
        this.numberOfBlocks = fileParser.readInteger(8);
        this.blockDuration = fileParser.readInteger(8) * 1000;
        this.numberOfSignals = fileParser.readInteger(4);
    }
}

export class FileParser {

    private offset = 0;

    constructor(private rawData: ArrayBuffer) { }

    public readString(stringLength: number): string {
        let rawValue: ArrayBuffer = this.rawData.slice(this.offset, this.offset + stringLength);
        this.offset += stringLength;
        return new TextDecoder("utf-8").decode(rawValue);
    }

    public readInteger(stringLength: number): number {
        return parseInt(this.readString(stringLength));
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
        return this.readStringList(listLength, stringUnitLength).map(str => parseInt(str));
    }
}


export class EDFChannel {

    constructor(
        public readonly label: string, // 16 ascii
        public readonly transducterType: string, // 80 ascii
        public readonly physicalDimension: string, // 8 ascii
        public readonly physicalMinimum: number,// 8 ascii
        public readonly physicalMaximum: number, // 8 ascii
        public readonly digitalMinimum: number, // 8 ascii 
        public readonly digitalMaximum: number, // 8 ascii
        public readonly prefiltering: string, // 80 ascii
        public readonly numberOfSamplesInDataRecord: number // 8 ascii
    ) { }


    static readChannelList(raw: ArrayBuffer, numberOfChannels: number): Array<EDFChannel> {
        // parse channels 

        const fileParser = new FileParser(raw);

        const channelLabelList: Array<string> = fileParser.readStringList(numberOfChannels, 16);
        const transducterTypeList: Array<string> = fileParser.readStringList(numberOfChannels, 80);
        const physicalDimensionList: Array<string> = fileParser.readStringList(numberOfChannels, 8);
        const physicalMinimumList: Array<number> = fileParser.readNumberList(numberOfChannels, 8);
        const physicalMaximumList: Array<number> = fileParser.readNumberList(numberOfChannels, 8);
        const digitalMinimumList: Array<number> = fileParser.readNumberList(numberOfChannels, 8);
        const digitalMaximumList: Array<number> = fileParser.readNumberList(numberOfChannels, 8);
        const prefilteringList: Array<string> = fileParser.readStringList(numberOfChannels, 80);
        const numberOfSampleList: Array<number> = fileParser.readNumberList(numberOfChannels, 8);
        fileParser.moveOffset(numberOfChannels * 32);

        const channels: Array<EDFChannel> = [];

        for (let i = 0; i < numberOfChannels; i++) {
            channels.push(new EDFChannel(
                channelLabelList[i],
                transducterTypeList[i],
                physicalDimensionList[i],
                physicalMinimumList[i],
                physicalMaximumList[i],
                digitalMinimumList[i],
                digitalMaximumList[i],
                prefilteringList[i],
                numberOfSampleList[i]
            ))
        }

        return channels;
    }
}