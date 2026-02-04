<!-- src/components/HomePage/RotatingGreeting.vue -->
<template>
  <div class="greeting">
    <transition name="fade" mode="out-in">
      <h1
        class="greeting-title"
        v-html="currentHeadline"
        :key="currentHeadline"
      ></h1>
    </transition>

    <p class="greeting-sub">
      Stay on top of your tasks, take breaks when you need them, and let us handle the reminders.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";

export default defineComponent({
  name: "RotatingGreeting",
  setup() {
    const headlines = [
      "Have you<br>planned your <br> day?",
      "When are you<br>going grocery<br>shopping?",
      "What’s your<br>top priority today?",
      "Don’t forget to<br>take a break.<br>relax and rest.",
      "Any tasks you <br>can finish in<br>5 minutes?",
    ];

    const idx = ref(0);
    const currentHeadline = ref(headlines[0]);
    let timer: number | undefined;

    onMounted(() => {
      timer = window.setInterval(() => {
        idx.value = (idx.value + 1) % headlines.length;
        currentHeadline.value = headlines[idx.value];
      }, 30000);
    });

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
    });

    return { currentHeadline };
  },
});
</script>

<style scoped>
.greeting {
  display: flex;
  flex-direction: column;
}

.greeting-title {
  font-size: clamp(40px, 6vw, 72px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  text-align: left;
}

.greeting-sub {
  margin-top: 16px;
  color: var(--subtext);
  font-size: 16px;
  max-width: 600px;
  text-align: left;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
