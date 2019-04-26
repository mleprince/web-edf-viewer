 <template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <a class="navbar-brand order-0 mr-4" href="#">EDF viewer</a>
    <select-file class="order-1 mr-2"/>
    <template v-if="this.isFileLoaded">
      <ul class="navbar-nav order-2 mr-2">
        <li class="nav-item active">
          <router-link class="nav-link" to="/">Viewer</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/montage">Montages</router-link>
        </li>
      </ul>

      <form class="order-3 ml-auto form-inline">
        <filter-selector></filter-selector>
        <select class="form-control" v-model="selectedGain">
          <option v-for="option in gainList" v-bind:value="option.value">{{option.label}}</option>
        </select>
        <select class="form-control ml-2" v-model="selectedResolution">
          <option v-for="option in resolutionList" v-bind:value="option">{{(option/1000)+"s"}}</option>
        </select>
        <button class="btn btn-outline-light ml-2" v-on:click="goToLeft" type="button">🡄</button>
        <button class="btn btn-outline-light ml-2" v-on:click="goToRight" type="button">🡆</button>
      </form>
    </template>
  </nav>
</template>
<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { GeneralStore } from "../store";
import SelectFile from "./SelectFile.vue";
import FilterSelector from "./FilterSelector.vue";
import AppConstants from "@/constants";

@Component({
  components: {
    SelectFile,
    FilterSelector
  }
})
export default class Menubar extends Vue {
  public gainList = AppConstants.gainList;
  public resolutionList = AppConstants.resolutionList;

  private store: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );

  private mounted(): void {
    window.addEventListener("keyup", this.handleKeykoardEvent);
  }

  private destroyed(): void {
    window.removeEventListener("keyup", this.handleKeykoardEvent);
  }

  public get selectedGain(): number {
    return this.store.currentMontage.signals[0].operation.gain;
  }
  public set selectedGain(newGain: number) {
    this.store.currentMontage.updateGain(newGain);
    this.store.applyMontage(this.store.currentMontage);
  }

  public get selectedResolution(): number {
    return this.store.currentResolution;
  }
  public set selectedResolution(newResolution: number) {
    this.store.changeCurrentWindow({
      startTime: this.store.currentStartTime,
      resolution: newResolution
    });
  }

  public get isFileLoaded(): boolean {
    return this.store.isFileLoaded;
  }

  private goToLeft() {
    this.store.goToLeft();
  }

  private goToRight() {
    this.store.goToRight();
  }

  private handleKeykoardEvent(event: KeyboardEvent): void {
    switch (event.key) {
      case "ArrowUp":
        this.changeGain(true);
        break;
      case "ArrowDown":
        this.changeGain(false);
        break;
      case "ArrowLeft":
        this.store.goToLeft();
        break;
      case "ArrowRight":
        this.store.goToRight();
        break;
    }
  }

  private changeGain(up: boolean): void {
    const index = AppConstants.gainList.findIndex(
      gain => gain.value === this.selectedGain
    );

    if (up && index < AppConstants.gainList.length - 1) {
      this.selectedGain = AppConstants.gainList[index + 1].value;
    } else if (!up && index > 0) {
      this.selectedGain = AppConstants.gainList[index - 1].value;
    }
  }
}
</script>
    