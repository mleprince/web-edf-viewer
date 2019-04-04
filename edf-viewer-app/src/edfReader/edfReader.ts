import { PromiseFileReader } from "./PromiseFileReader";
import { FileParser } from "./fileParser";





export class EDFFile {

    private constructor(
        public readonly header: EDFHeader,
        public readonly channels: Array<EDFChannel> = [],
        private file: File,
    ) { }

    public static open(file: File): Promise<EDFFile> {

        return PromiseFileReader
            .open(file.slice(0, 256))   // We first read the first 256 bytes of the header which contains general infos
            .then(rawHeader => {
                const edfHeader = new EDFHeader(rawHeader);

                // we read the channelHeaders

                return PromiseFileReader.open(file.slice(256, 256 + edfHeader.number_of_signals * 256)).then(raw => {

                    const channelHeaderList = EDFChannel.readChannelList(raw, edfHeader.number_of_signals);

                    return new EDFFile(edfHeader, channelHeaderList, file);
                });
            });
    }

    /**
     * Get a window of points
     * @param startTime  : in mS
     * @param duration : is mS
     */
    public getWindow(startTime: number, duration: number): Promise<Array<Float32Array>> {

        return new Promise((resolve, reject) => {

            const endTime = startTime + duration;

            if (this.checkBounds(startTime, duration)) {
                reject("Window out of bounds");
            }

            // calculate the corresponding blocks to get

            const firstBlockStartTime = (startTime - startTime % this.header.block_duration);

            const firstBlockIndex = firstBlockStartTime / this.header.block_duration;

            const numberOfBlocksToGet = Math.ceil(duration / this.header.block_duration);

            const lastBlockEndTime = (firstBlockIndex + numberOfBlocksToGet) * this.header.block_duration;

            const offsetInFile = this.header.byteSizeHeader + firstBlockIndex * this.getSizeOfDataBlock();

            const lastOffsetInFile = offsetInFile + numberOfBlocksToGet * this.getSizeOfDataBlock();

            const fileReader = new FileReader();

            fileReader.onerror = error => reject(error);
            fileReader.onloadend = () => {

                const raw: ArrayBuffer = <ArrayBuffer>fileReader.result;

                const samples = new Int16Array(raw);

                const result: Array<Array<number>> = this.channels.map(channel => []);

                let index = 0;

                // we fill the samples in one array by channel
                for (let i = 0; i < numberOfBlocksToGet; i++) {
                    this.channels.forEach((channel, j) => {
                        for (let k = 0; k < channel.number_of_samples_in_data_record; k++) {
                            result[j].push(samples[index] * channel.scale_factor);
                            index++;
                        }
                    });
                }

                // cut before and after
                this.channels.forEach((channel, i) => {

                    const frequency = channel.number_of_samples_in_data_record / this.header.block_duration;

                    const before = (startTime - firstBlockStartTime) * frequency;

                    const after = (lastBlockEndTime - endTime) * frequency;

                    result[i] = result[i].slice(before, result[i].length - after);

                });

                resolve(result.map(channelData => new Float32Array(channelData)));
            };

            fileReader.readAsArrayBuffer(this.file.slice(offsetInFile, lastOffsetInFile));
        });
    }

    private checkBounds(startTime: number, duration: number): boolean {
        return false;
    }

    private getSizeOfDataBlock() {
        let size = 0;

        this.channels.forEach(channel => {
            size += channel.number_of_samples_in_data_record * 2; // sample encoded in uint16
        });

        return size;
    }
}

export class EDFHeader {

    public readonly fileVersion: string; // 8 ascii
    public readonly localPatientIdentification: string; // 80 ascii
    public readonly localRecordingIdentification: string; // 80 ascii
    public readonly startDate: string; // 8 ascii
    public readonly startTime: string; // 8 ascii

    public readonly recordStartTime: number;

    public readonly byteSizeHeader: number; // 8 ascii
    public readonly number_of_blocks: number; // 8 ascii
    public readonly block_duration: number; // 8 ascii
    public readonly number_of_signals: number; // 4 ascii

    constructor(raw: ArrayBuffer) {

        const fileParser = new FileParser(raw);

        this.fileVersion = fileParser.readString(8);
        this.localPatientIdentification = fileParser.readString(80);
        this.localRecordingIdentification = fileParser.readString(80);
        this.startDate = fileParser.readString(8);
        this.startTime = fileParser.readString(8);

        if (this.startDate !== "" && this.startTime !== "") {
            const splittedDate: Array<number> = this.startDate.split(".").map(str => parseInt(str, 10));
            const splittedTime: Array<number> = this.startTime.split(".").map(str => parseInt(str, 10));
            this.recordStartTime = Date.UTC(
                splittedDate[2],
                splittedDate[1] - 1,
                splittedDate[0],
                splittedTime[0],
                splittedTime[1],
                splittedTime[2],
            );
        } else {
            this.recordStartTime = 0;
        }

        this.byteSizeHeader = fileParser.readInteger(8);
        fileParser.moveOffset(44);
        this.number_of_blocks = fileParser.readInteger(8);
        this.block_duration = fileParser.readInteger(8) * 1000;
        this.number_of_signals = fileParser.readInteger(4);
    }
}

export class EDFChannel {

    public readonly scale_factor: number;

    constructor(
        public readonly label: string, // 16 ascii
        public readonly transducterType: string, // 80 ascii
        public readonly physicalDimension: string, // 8 ascii
        public readonly physicalMinimum: number, // 8 ascii
        public readonly physicalMaximum: number, // 8 ascii
        public readonly digitalMinimum: number, // 8 ascii
        public readonly digitalMaximum: number, // 8 ascii
        public readonly prefiltering: string, // 80 ascii
        public readonly number_of_samples_in_data_record: number, // 8 ascii
    ) {
        this.scale_factor = (physicalMaximum - physicalMinimum) / (digitalMaximum - digitalMinimum);
    }

    public static readChannelList(raw: ArrayBuffer, numberOfChannels: number): Array<EDFChannel> {
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
                numberOfSampleList[i],
            ));
        }

        return channels;
    }
}
