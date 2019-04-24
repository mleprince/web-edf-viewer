<template>
  <div class="viewer d-flex flex-row p-4">
    <div class="channel-label-list mr-2 d-flex flex-column">
      <div class="channel-label flex-fill" v-for="label in channelLabels">{{label}}</div>
    </div>
    <canvas class="flex-fill card chart" id="chart" ref="chart"></canvas>
    <div class="fileNotLoaded" v-show="!isfileLoaded">
      <h2>No Signals</h2>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { GeneralStore } from "@/store";
import { Signal, Montage } from "@/model/montage";
import * as worker from "../../public/assembly/edf_viewer_worker";

@Component
export default class Viewer extends Vue {
  private store: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );

  constructor() {
    super();
  }

  private mounted() {
    this.chart.width = this.chart.clientWidth;
    this.chart.height = this.chart.clientHeight;

    if (this.isfileLoaded) {
      this.drawChart();
    }

    window.addEventListener("resize", () => this.resize());
  }

  private destroyed() {
    window.removeEventListener("resize", () => this.resize);
  }

  private resize() {
    this.chart.width = this.chart.clientWidth;
    this.chart.height = this.chart.clientHeight;
    this.drawChart();
  }

  public get isfileLoaded(): boolean {
    return this.store.isFileLoaded;
  }

  public get isWindowChanged(): string {
    return [
      this.store.currentResolution,
      this.store.currentStartTime,
      this.store.isFileLoaded,
      JSON.stringify(this.store.currentMontage) // TODO : find another solution to detect montage update
    ].join();
  }

  @Watch("isWindowChanged")
  private onWindowChanged(val: string, oldVal: string) {
    this.drawChart();
  }

  get channelLabels(): Array<string> {
    return this.store.currentMontage.signals.map(signal => signal.label);
  }

  get chart(): HTMLCanvasElement {
    return <HTMLCanvasElement>this.$refs.chart;
  }

  // TODO : handle signals with different sampling rate
  private drawChart() {
    console.debug("Draw chart");
    worker.read_window(
      this.store.currentStartTime,
      this.store.currentResolution,
      this.chart.width,
      this.chart.height,
      "chart"
    );
  }
}
</script>

<style scoped>
.fileNotLoaded {
  text-align: center;
  padding-top: 20px;
  position: absolute;
  width: 100%;
}

.channel-label {
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: column;
}
</style>
