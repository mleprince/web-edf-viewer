import { EDFFile } from "@/edfReader/edfReader";
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

  @getter public edfFile: EDFFile | null = null;
  @getter public currentResolution: number = 20000;
  @getter public currentStartTime: number = 0;
  @getter public currentMontage: Montage | null = null;

  @getter public selectedGain: number = 1;

  @getter
  get isFileLoaded(): boolean {
    return this.edfFile !== null;
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
  public storeEdfFile(edfFile: EDFFile) {
    this.edfFile = edfFile;
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
    return EDFFile.open(file).then(edf => {
      this.storeEdfFile(edf);

      const montage = Montage.getDefaultMontage(edf);

      worker.compute_window(montage, edf, worker.alloc(100), 10, 10);
      this.applyMontage(montage);
    });
  }
}

export const generalStore = GeneralStore.ExtractVuexModule(GeneralStore);

export default new Vuex.Store({
  modules: { generalStore },
  plugins: [createLogger()],
});
