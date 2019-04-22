import { EDFHeader } from "./edfReader/edfReader";
import Vue from "vue";
import Vuex, { StoreOptions } from "vuex";
import { Montage } from "./model/montage";
import createLogger from "vuex/dist/logger";
import { VuexModule, mutation, action, getter, Module } from "vuex-class-component";
import * as worker from "../public/assembly/edf_viewer_worker";

Vue.use(Vuex);

export interface Window {
  resolution: number;
  startTime: number;
}

@Module()
export class GeneralStore extends VuexModule {

  @getter public edfHeader: EDFHeader | null = null;
  @getter public currentResolution: number = 20000;
  @getter public currentStartTime: number = 0;
  @getter public currentMontage: Montage | null = null;

  @getter public selectedGain: number = 1;

  @getter
  get isFileLoaded(): boolean {
    return this.edfHeader !== null;
  }

  @mutation
  public updateSelectedGain(newGain: number) {
    this.selectedGain = newGain;
  }

  @mutation
  public changeCurrentWindow(newWindow: Window) {
    this.currentResolution = newWindow.resolution;
    this.currentStartTime = newWindow.startTime;
  }

  @mutation
  public applyMontage(montage: Montage) {
    this.currentMontage = montage;
  }

  @mutation
  private applyEdfHeader(edfHeader: EDFHeader) {
    this.edfHeader = edfHeader;
  }

  @mutation
  public goToLeft() {
    this.currentStartTime = this.currentStartTime - this.currentResolution / 2;
  }

  @mutation
  public goToRight() {
    this.currentStartTime = this.currentStartTime + this.currentResolution / 2;
  }

  @action()
  public async loadEdfFile(file: File) {

    worker.init_reader(file).then((edfHeader: EDFHeader) => {
      this.applyEdfHeader(edfHeader);
      const montage = Montage.getDefaultMontage(edfHeader);
      console.log(montage);
      worker.set_current_montage(montage.toRustStruct());

      worker.read_window(0, 10000).then((result: Array<Float32Array>) => console.log(result));

    });
  }
}

export const generalStore = GeneralStore.ExtractVuexModule(GeneralStore);

export default new Vuex.Store({
  modules: { generalStore },
  plugins: [createLogger()],
});
