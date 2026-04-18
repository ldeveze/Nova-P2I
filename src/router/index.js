import { createRouter, createWebHistory } from "vue-router";
import Jeu from "../pages/JeuPage.vue";
import Accueil from "../pages/AccueilPage.vue";
import Configuration from "../pages/ConfigurationPage.vue";
import Scores from "../pages/ScoresPage.vue";
import Recap from "../pages/RecapPage.vue";

const routes = [
  { path: "/", component: Accueil },
  { path: "/configuration", component: Configuration },
  { path: "/jeu", component: Jeu },
  { path: "/scores", component: Scores },
  { path: "/recapitulatif", component: Recap },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
