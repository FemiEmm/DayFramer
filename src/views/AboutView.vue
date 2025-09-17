<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div class="box frame1">Box 1</div>
    <div class="box frame2">Box 2</div>
    <div class="box primary-text">Box 3</div>
    <div class="box secondary-text">Box 4</div>
    <div class="box nav-bar">Box 5</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AboutMe",
});
</script>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.box {
  width: 150px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--primary-text-color);
  border-radius: 8px;
  text-align: center;
}

.frame1 {
  background-color: var(--frame1-color);
}

.frame2 {
  background-color: var(--frame2-color);
}

.primary-text {
  background-color: var(--button-color);
}

.secondary-text {
  background-color: var(--button-hover-color);
}

.nav-bar {
  background-color: var(--nav-bar-color);
}
</style>
