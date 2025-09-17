<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  setup() {
    const toggleTheme = () => {
      document.documentElement.classList.toggle("dark-theme");
    };

    return { toggleTheme };
  },
});
</script>

<style src="./assets/style.css"></style>

<style>
#app {
  font-family: Epilogue, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--primary-text-color);
}
</style>
