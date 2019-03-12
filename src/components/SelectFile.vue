<template>
  <div>
    <input type="file" id="file" ref="myFile" style="display:none;" @change="loadFile">
    <button class="btn btn-outline-light" type="button" @click="trigger">Ouvrir un fichier</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { GeneralStore } from "../store";

@Component
export default class SelectFile extends Vue {
  private generalStore: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );

  public trigger() {
    (<HTMLInputElement>this.$refs.myFile).click();
  }

  public loadFile(event: any) {
    const file: File = event.target.files[0];
    this.generalStore.loadEdfFile(file);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>

