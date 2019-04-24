
/* eslint no-use-before-define: 0 */  // --> OFF

export interface EDFHeader {

    file_version: string; // 8 ascii
    localPatientIdentification: string; // 80 ascii
    localRecordingIdentification: string; // 80 ascii
    startDate: string; // 8 ascii
    startTime: string; // 8 ascii

    recordStartTime: number;

    byteSizeHeader: number; // 8 ascii
    number_of_blocks: number; // 8 ascii
    block_duration: number; // 8 ascii
    number_of_signals: number; // 4 ascii

    channels: Array<EDFChannel>;
}

export interface EDFChannel {

    scale_factor: number;
    label: string; // 16 ascii
    transducterType: string; // 80 ascii
    physicalDimension: string; // 8 ascii
    physicalMinimum: number; // 8 ascii
    physicalMaximum: number; // 8 ascii
    digitalMinimum: number; // 8 ascii
    digitalMaximum: number; // 8 ascii
    prefiltering: string; // 80 ascii
    number_of_samples_in_data_record: number; // 8 ascii
}
