<template>
  <div class="filer-selector">
    <select class="form-control mr-2" v-model="highpass">
      <option :value="null">---</option>
      <option v-for="option in highpassList" v-bind:value="option">{{option}}Hz</option>
    </select>
    <select class="form-control mr-2" v-model="lowpass">
      <option :value="null">---</option>
      <option v-for="option in lowpassList" v-bind:value="option">{{option}}Hz</option>
    </select>
    <select class="form-control mr-4" v-model="notch">
      <option :value="null">---</option>
      <option v-for="option in notchList" v-bind:value="option">{{option}}Hz</option>
    </select>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { GeneralStore } from "../store";
import SelectFile from "./SelectFile.vue";
import AppConstants from "@/constants";
import { FilterDescription, FilterType } from "../model/montage";

@Component
export default class FilterSelector extends Vue {
  private store: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );

  public lowpassList = AppConstants.lowpassList;
  public highpassList = AppConstants.highpassList;
  public notchList = AppConstants.notchList;

  get notch() {
    return this.getFilterValue(FilterType.Notch);
  }

  set notch(value: number | null) {
    this.setFilterValue(FilterType.Notch, value);
  }

  get lowpass() {
    return this.getFilterValue(FilterType.Lowpass);
  }

  set lowpass(value: number | null) {
    this.setFilterValue(FilterType.Lowpass, value);
  }

  get highpass() {
    return this.getFilterValue(FilterType.Highpass);
  }

  set highpass(value: number | null) {
    this.setFilterValue(FilterType.Highpass, value);
  }

  private setFilterValue(filterType: FilterType, newValue: number | null) {
    this.store.currentMontage.updateFilters(filterType, newValue);
    this.store.applyMontage(this.store.currentMontage);
  }

  private getFilterValue(filterType: FilterType): number | null {
    let value = null;

    const filter = this.store.currentMontage.signals[0].filter.find(
      filterDescription => filterDescription.filterType === filterType
    );

    if (filter !== undefined) {
      value = filter.freq;
    }

    return value;
  }
}
</script>


