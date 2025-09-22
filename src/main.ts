// src/main.ts
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./assets/style.css";
import "./assets/reset.css";
import "@fortawesome/fontawesome-free/css/all.css";

// global UI sounds
import SfxPlugin from "./plugins/sfx";

const app = createApp(App);

app.use(store).use(router);

// enable global click + hover sounds from /public/click/
app.use(SfxPlugin, {
  clickBase: "/click/ClickSound",
  hoverBase: "/click/HoverSound",
  volume: 0.28,          // 0..1
  hoverThrottleMs: 160,  // prevent hover spam
  enabled: true
});

app.mount("#app");
