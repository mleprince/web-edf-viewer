<template>
  <div class="viewer d-flex flex-colump p-4">
    <div v-if="isfileLoaded" class="flex-fill card chart" id="chart">
      <div class="spinner-border text-info" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </div>
    <div class="flex-fill fileNotLoaded" v-if="!isfileLoaded">
      <h2>Veuillez charger un fichier</h2>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import SignalTransformer, { SignalData } from "../service/signalTransormer";
import JsFilterService from "../service/filter/js.filter.service";
import JsMontageService from "../service/montage/js.montage.service";
import { GeneralStore } from "@/store";
import Dygraph from "dygraphs";
import { Signal, Montage } from "@/model/montage";
import * as worker from "../../public/assembly/edf_viewer_worker";
import * as worker2 from "@/Worker";

@Component
export default class Viewer extends Vue {
  private signalTransformer: SignalTransformer;

  private store: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );

  constructor() {
    super();
    this.signalTransformer = new SignalTransformer(
      new JsFilterService(),
      new JsMontageService()
    );
  }

  private mounted() {
    if (this.isfileLoaded) {
      this.drawChart();
    }
  }

  public get isfileLoaded(): boolean {
    return this.store.isFileLoaded;
  }

  public get isWindowChanged(): string {
    return [
      this.store.currentResolution,
      this.store.currentStartTime,
      this.store.isFileLoaded,
      this.store.selectedGain
    ].join();
  }

  @Watch("isWindowChanged")
  private onWindowChanged(val: string, oldVal: string) {
    this.drawChart();
  }

  // TODO : handle signals with different sampling rate
  private drawChart() {
    if (this.store.edfFile !== null && this.store.currentMontage !== null) {
      const montage = this.store.currentMontage;

      this.store.edfFile
        .getWindow(this.store.currentStartTime, this.store.currentResolution)
        .then(rawData => {
          const computedSignal: Array<
            SignalData
          > = this.signalTransformer.getFinalSignal(rawData, montage);

          const maxNumberOfPoints = this.getMaxNumberOfPoints(computedSignal);

          const result: Array<Array<number>> = this.initDataWithTimeline(
            this.store.currentStartTime,
            this.store.currentResolution,
            maxNumberOfPoints,
            computedSignal.length
          );

          computedSignal.forEach((signalData, i) => {
            if (signalData.data.length < maxNumberOfPoints) {
              // special case => we have to upsample
              for (let j = 0; j < signalData.data.length; j++) {
                // compute index of the point
                const timestamp =
                  this.store.currentStartTime +
                  j * (1000 / signalData.meta.samplingRate);

                const index = Math.floor(
                  (j * (1000 / signalData.meta.samplingRate)) /
                    (this.store.currentResolution / maxNumberOfPoints)
                );

                result[index][i + 1] =
                  signalData.data[j] * this.store.selectedGain + 1000 * i;
              }
            } else {
              for (let j = 0; j < signalData.data.length; j++) {
                result[j][i + 1] =
                  signalData.data[j] * this.store.selectedGain + 1000 * i;
              }
            }
          });

          const graph = new Dygraph("chart", result, {
            labelsUTC: true,
            labels: ["time"].concat(
              computedSignal.map(signalData => signalData.meta.label)
            ),
            axes: {
              y: {
                ticker: (min, max, pixels, opts, dygraph, vals) => {
                  return this.getLabels(computedSignal);
                },
                axisLabelWidth: 100
              }
            },
            valueRange: [-1000, computedSignal.length * 1000],
            showLabelsOnHighlight: false
          });
        });
    } else {
      throw new Error("You must load a file before drawing");
    }
  }

  private getLabels(
    rawData: Array<SignalData>
  ): Array<{ v: number; label: string }> {
    return rawData.map((signalData, i) => {
      return {
        v: i * 1000,
        label: signalData.meta.label
      };
    });
  }

  private getMaxNumberOfPoints(rawData: Array<SignalData>) {
    let max = 0;

    rawData.forEach(signalData => {
      if (signalData.data.length > max) {
        max = signalData.data.length;
      }
    });
    return max;
  }

  private initDataWithTimeline(
    startTime: number,
    resolution: number,
    numberOfPoints: number,
    numberOfChannels: number
  ): Array<Array<number>> {
    const result = new Array(numberOfPoints);

    const delta = resolution / numberOfPoints;

    for (let i = 0; i < numberOfPoints; i++) {
      result[i] = new Array(numberOfChannels + 1).fill(null);
      result[i][0] = new Date(startTime + i * delta);
    }

    return result;
  }
}
</script>

<style scoped>
.fileNotLoaded {
  text-align: center;
  padding-top: 20px;
}
</style>
