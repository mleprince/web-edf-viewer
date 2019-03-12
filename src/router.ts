import Vue from "vue";
import Router from "vue-router";
import Viewer from "./views/Viewer.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "viewer",
      component: Viewer,
    },
    {
      path: "/montage",
      name: "montage",
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "montage" */ "./views/Montage.vue"),
    },
  ],
});
