import { EDFHeader } from "./model/edfHeader";
import Vue from "vue";
import Vuex, { StoreOptions } from "vuex";
import { Montage } from "./model/montage";
import createLogger from "vuex/dist/logger";
import { VuexModule, mutation, action, getter, Module } from "vuex-class-component";
import * as worker from "../../worker/pkg/edf_viewer_worker";

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
  @getter public currentMontage: Montage = new Montage("default", []);

  @getter
  get isFileLoaded(): boolean {
    return this.edfHeader !== null;
  }

  @mutation
  public changeCurrentWindow(newWindow: Window) {
    this.currentResolution = newWindow.resolution;
    this.currentStartTime = newWindow.startTime;
  }

  @mutation
  public applyMontage(montage: Montage) {
    this.currentMontage = montage;
    worker.set_current_montage(montage.toWasmStruct());
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
      this.applyMontage(montage);
    });
  }
}

export const generalStore = GeneralStore.ExtractVuexModule(GeneralStore);

export default new Vuex.Store({
  modules: { generalStore },
  plugins: [createLogger()],
});
