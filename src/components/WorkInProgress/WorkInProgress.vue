<!-- src/components/WorkInProgress/WorkInProgress.vue -->
<template>
  <div class="page-content">
    <section class="below-hero">
      <div class="user-greeting-wrapper">
        <UserGreeting />
      </div>
      <DashBoard />
    </section>

    <!-- HERO -->
    <section class="hero">
      <!-- LEFT -->
      <div class="hero-left">
        <div class="badges">
          <button class="btn btn-secondary" @click="goBack">← Back</button>
          <UiBadge icon="✨" label="Thanks for your patience" />
        </div>

        <h1 class="hero-title">We’re currently working on this page</h1>
        <p class="hero-sub">
          This section isn’t ready yet. We’re polishing the experience—check back soon!
        </p>

        <div class="hero-ctas">
          <button class="btn btn-primary" @click="goHome">Go to Homepage</button>
        </div>

        <a href="#" class="hero-link">Need help? Visit the guide.</a>
      </div>

      <!-- RIGHT (replaced TodayCard with circular image) -->
      <div class="hero-right">
        <div class="wip-avatar">
          <img :src="wipImg" alt="Work in progress" />
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import DashBoard from "../DashBoard.vue";
import UserGreeting from "@/components/HomePage/UserGreeting.vue";
import UiBadge from "@/components/HomePage/UiBadge.vue";
import wipImg from "@/assets/wip/wip-avatar.png";

export default defineComponent({
  name: "WorkInProgress",
  components: { DashBoard, UserGreeting, UiBadge },
  setup() {
    const router = useRouter();
    const goBack = () => router.back();
    const goHome = () => router.push({ name: "Homepage" });

    return { goBack, goHome, wipImg };
  },
});
</script>

<style scoped>
:root {
  --hero-max: 1200px;
  --text: #121212;
  --subtext: #606060;
  --white: #ffffff;
}

.page-content {
  min-height: 100vh;
  width: 100%;
  padding: 50px 50px 0px 150px;
  background-color: var(--background-color);
  box-sizing: border-box;
}

.below-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--hero-max);
  margin: 0 auto;
  padding: 0 120px 0px;
}

.user-greeting-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.hero {
  max-width: var(--hero-max);
  margin: 0 auto;
  padding: 80px 24px 40px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}

.hero-left { display: flex; flex-direction: column; }
.badges { display: flex; gap: 12px; margin-bottom: 20px; }

.hero-title {
  font-size: clamp(40px, 6vw, 72px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  text-align: left;
}
.hero-sub {
  margin-top: 16px;
  color: var(--subtext);
  font-size: 16px;
  max-width: 600px;
  text-align: left;
}
.hero-ctas { display: flex; gap: 12px; margin-top: 28px; }

.btn {
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.btn-primary {
  color: var(--secondary-text-color);
  background-color: var(--button-color);
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(0,0,0,.22);
  background-color: var(--button-hover-color);
  color: var(--primary-text-color);
}
.btn-secondary {
  background: var(--white);
  color: var(--text);
  border-color: #e8e8e8;
  box-shadow: 0 4px 12px rgba(0,0,0,.06);
}
.btn-secondary:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(0,0,0,.12); }

.hero-link {
  margin-top: 10px;
  color: #7a7a7a;
  font-size: 14px;
  text-decoration: underline;
  width: fit-content;
}

.hero-right { justify-self: center; }

/* Circular image */
.wip-avatar {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(0,0,0,0.08);
  box-shadow: 0 14px 40px rgba(0,0,0,0.18);
  display: grid;
  place-items: center;
}
.wip-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive */
@media (max-width: 980px) {
  .page-content { padding-left: 16px; }
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 56px; padding-bottom: 24px; }
  .hero-right { justify-self: stretch; display: flex; justify-content: center; }
}
</style>
