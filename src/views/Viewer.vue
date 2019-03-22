<template>
  <div class="viewer d-flex flex-colump p-4">
    <div v-if="isfileLoaded" class="flex-fill card chart" id="chart" ref="chart">
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
import { Signal } from "@/model/montage";
import WebAssemblyFilterService from "@/service/filter/wsam.filter.service";

@Component
export default class Viewer extends Vue {
  private signalTransformer: SignalTransformer;

  private store: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );

  private graph: null | Dygraph = null;

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

          const finalData = this.downSample2(computedSignal);

          if (this.graph === null) {
            const graph = new Dygraph("chart", finalData, {
              labelsUTC: true,
              labels: ["time"].concat(
                computedSignal.map(signalData => signalData.meta.label)
              ),
              legend: "never",
              connectSeparatedPoints: true,
              colors: computedSignal.map(_ => "black"),
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

            Object.keys(graph).forEach(key => {
              Object.defineProperty(graph, key, { configurable: false });
            });

            this.graph = graph;
          } else {
            this.graph.updateOptions({
              file: finalData
            });
          }
        });
    } else {
      throw new Error("You must load a file before drawing");
    }
  }

  private downSample2(computedSignal: Array<SignalData>): Array<Array<number>> {
    const finalData = this.initDataWithTimeline(
      this.store.currentStartTime,
      this.store.currentResolution,
      this.getMaxNumberOfPoints(computedSignal),
      computedSignal.length
    );

    computedSignal.forEach((signalData, i) =>
      this.functionMinor(finalData, signalData, i)
    );

    return finalData;
  }

  private functionMinor(
    finalData: Array<Array<number>>,
    signalData: SignalData,
    i: number
  ) {
    const gain = this.store.selectedGain;

    if (signalData.data.length < finalData.length) {
      for (let j = 0; j < signalData.data.length; j++) {
        const index = Math.floor(
          (j * finalData.length) / signalData.data.length
        );
        finalData[index][i + 1] = signalData.data[j] * gain + 1000 * i;
      }
    } else {
      for (let j = 0; j < signalData.data.length; j++) {
        finalData[j][i + 1] = signalData.data[j] * gain + 1000 * i;
      }
    }
  }

  private downSample(computedSignal: Array<SignalData>): Array<Array<number>> {
    // get width of the chart
    const yAxisWidth = 100;
    const widthInPixels =
      (<HTMLDivElement>this.$refs.chart).clientWidth - yAxisWidth;

    const finalData = new Array(widthInPixels * 2);

    const startTime = this.store.currentStartTime;
    const resolution = this.store.currentResolution;

    const gain = this.store.selectedGain;

    for (let i = 0; i < widthInPixels; i++) {
      const timestamp = new Date(startTime + (resolution * i) / widthInPixels);

      finalData[2 * i] = new Array(computedSignal.length + 1).fill(-Infinity);
      finalData[2 * i + 1] = new Array(computedSignal.length + 1).fill(
        Infinity
      );
      finalData[2 * i][0] = timestamp;
      finalData[2 * i + 1][0] = timestamp;
    }

    computedSignal.forEach((signalData, i) => {
      if (signalData.data.length < widthInPixels * 2) {
        // special case => we don't use the min/max technique
        for (let j = 0; j < signalData.data.length; j++) {
          // compute index of the point

          const index =
            2 *
            Math.floor(
              (j * (1000 / signalData.meta.samplingRate)) /
                (resolution / widthInPixels)
            );

          finalData[index][i + 1] = signalData.data[j] * gain + 1000 * i;
        }
      } else {
        let lastIndex = 0;
        let posMin = 0;
        let posMax = 0;

        for (let j = 0; j < signalData.data.length; j++) {
          const index =
            2 *
            Math.floor(
              (j * (1000 / signalData.meta.samplingRate)) /
                (resolution / widthInPixels)
            );

          if (index > lastIndex && posMin > posMax) {
            // we reorder the last min/max
            const LastMinValue = finalData[lastIndex + 1][i + 1];
            finalData[lastIndex + 1][i + 1] = finalData[lastIndex][i + 1];
            finalData[lastIndex][i + 1] = LastMinValue;
          }

          lastIndex = index;

          const value = signalData.data[j];
          if (value < finalData[index + 1][i + 1]) {
            finalData[index + 1][i + 1] = value * gain + 1000 * i;
            posMin = j;
          }
          if (value > finalData[index][i + 1]) {
            finalData[index][i + 1] = value * gain + 1000 * i;
            posMax = j;
          }
        }
      }
    });

    return finalData;
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
