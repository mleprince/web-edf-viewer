<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <menubar/>
    <div class="flex-fill d-flex flex-column">
      <router-view class="flex-fill"/>
    </div>
  </div>
</template>


<script lang="ts">
import Vue from "vue";
import Menubar from "./components/Menubar.vue";
import Component from "vue-class-component";
import { GeneralStore } from "./store";
import AppConstants from "./constants";

@Component({
  components: {
    Menubar
  }
})
export default class App extends Vue {
  private store: GeneralStore = GeneralStore.CreateProxy(
    this.$store,
    GeneralStore
  );
}
</script>

<style>
html,
body {
  height: 100%;
}
</style>
