import { EDFFile } from './edfReader';

// handle select file event

const eventInput: HTMLInputElement = <HTMLInputElement>document.getElementById("open-file");

const readWindowInput: HTMLInputElement = <HTMLInputElement>document.getElementById("read-window");

const fileInput: HTMLInputElement = <HTMLInputElement>document.getElementById("file");


let edfFile: EDFFile | null = null;

eventInput.addEventListener("click", () => {

  if (fileInput.files !== null && fileInput.files[0]) {
    const selectedFile = fileInput.files[0];

    checkFile(selectedFile);

    EDFFile.open(selectedFile).then(edf => {
      edfFile = edf
      console.log(edf);
    });

  }
  else console.error("no selected file");

})

readWindowInput.addEventListener("click", () => {
  if (edfFile != null) {

    edfFile.getWindow(1000, 20 * 1000).then(result => {
      console.log(result);
    })
  }
})

function checkFile(file: File) {
  if (!file.name.endsWith(".edf")) throw Error("It is not an EDF File");
}



