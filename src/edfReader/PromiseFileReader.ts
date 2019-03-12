export class PromiseFileReader {

    public static open(file: File | Blob): Promise<ArrayBuffer> {

        return new Promise((resolve, reject) => {
            const fileReader: FileReader = new FileReader();

            fileReader.onerror = error => reject(error);

            fileReader.onloadend = () => {

                const raw: ArrayBuffer = <ArrayBuffer>fileReader.result;
                console.debug("FileReader : file size : " + raw.byteLength);
                resolve(raw);
            };

            fileReader.readAsArrayBuffer(file);
        });
    }
}
