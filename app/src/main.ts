import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "bootstrap/dist/css/bootstrap.min.css";

import { initWorker } from "./Worker";

initWorker().then(_ => {

  Vue.config.productionTip = false;

  new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount("#app");
});
