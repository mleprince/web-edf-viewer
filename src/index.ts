import { SignalTransformer } from './signalTransormer';
import { EDFFile } from './edfReader/edfReader';

// handle select file event

const eventInput: HTMLInputElement = <HTMLInputElement>document.getElementById("open-file");

const readWindowInput: HTMLInputElement = <HTMLInputElement>document.getElementById("read-window");

const fileInput: HTMLInputElement = <HTMLInputElement>document.getElementById("file");

let edfFile: EDFFile;

eventInput.addEventListener("click", () => {

  if (fileInput.files !== null && fileInput.files[0]) {
    const selectedFile = fileInput.files[0];

    checkFile(selectedFile);

    EDFFile.open(selectedFile).then(edf => {
      edfFile = edf
      console.log(edf);
    });

  }
  else {
    console.error("no selected file");
  }

})

readWindowInput.addEventListener("click", () => {
  readWindow();
})

function checkFile(file: File) {
  if (!file.name.endsWith(".edf")) throw Error("It is not an EDF File");
}



function readWindow() {
  if (edfFile != null) {

    edfFile.getWindow(1000, 5 * 1000).then(result => {
      console.log(result);

      // we display only the two first signals 

      let signal = [];

      for (let i = 0; i < result[0].length; i++) {
        signal.push([i, result[5][i], result[1][i]]);
      }

      new Dygraph('chart', signal);

    })
  }
}

new SignalTransformer();



