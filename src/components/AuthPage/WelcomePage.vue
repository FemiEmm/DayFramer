<template>
  <div class="page-content">
    <!-- BELOW HERO: brand remains -->
    <section class="below-hero">
      <div class="user-greeting-wrapper">
        <div class="brand" aria-hidden="true">
          <span class="brand-icon"><i class="fa-solid fa-calendar-day"></i></span>
          <span class="brand-text">Dayframer</span>
        </div>
      </div>
    </section>

    <!-- HERO -->
    <section class="hero">
      <!-- LEFT -->
      <div class="hero-left">
        <transition name="fade" mode="out-in">
          <h1 class="hero-title" v-html="currentHeadline" :key="currentHeadline"></h1>
        </transition>

        <p class="hero-sub">
          Plan your day, map your week, and set clear monthly goals—all in one place.
        </p>

        <router-link class="hero-link" :to="{ name: 'Help' }">Need help? Visit the guide.</router-link>
      </div>

      <!-- RIGHT: AUTH PANEL -->
      <div class="hero-right">
        <div class="auth-card">
          <div class="auth-tabs" role="tablist" aria-label="Authentication modes">
            <button
              class="auth-tab"
              :class="{ active: activeTab === 'signin' }"
              role="tab"
              :aria-selected="activeTab === 'signin'"
              @click="activeTab = 'signin'"
            >
              Sign in
            </button>
            <button
              class="auth-tab"
              :class="{ active: activeTab === 'signup' }"
              role="tab"
              :aria-selected="activeTab === 'signup'"
              @click="activeTab = 'signup'"
            >
              Create account
            </button>
          </div>

          <div class="auth-body" role="tabpanel">
            <SignIn v-if="activeTab === 'signin'" :redirect="redirect" class="auth-form" />
            <SignUp v-else :redirect="redirect" class="auth-form" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

/* Auth components */
import SignIn from "@/components/AuthPage/SignIn.vue";
import SignUp from "@/components/AuthPage/SignUp.vue";

export default defineComponent({
  name: "WelcomePage",
  components: {
    SignIn,
    SignUp,
  },
  setup() {
    const headlines = [
      "Welcome to <br>Dayframer.",
      "Plan your <br>day with ease.",
      "Own your <br>week’s priorities.",
      "Set goals for <br>the month ahead.",
      "Your time, <br>framed your way.",
    ];
    const idx = ref(0);
    const currentHeadline = ref(headlines[idx.value]);
    let timer: number | undefined;

    onMounted(() => {
      timer = window.setInterval(() => {
        idx.value = (idx.value + 1) % headlines.length;
        currentHeadline.value = headlines[idx.value];
      }, 30000);
    });
    onBeforeUnmount(() => { if (timer) clearInterval(timer); });

    const route = useRoute();
    const activeTab = ref<"signin" | "signup">(
      (route.query.mode === "signup" ? "signup" : "signin") as "signin" | "signup"
    );
    const redirect = (route.query.redirect as string) || undefined;

    return { currentHeadline, activeTab, redirect };
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

/* Page wrapper */
.page-content {
  min-height: 100vh;
  width: 100%;
  padding: 50px 50px 0px 150px;
  background-color: var(--background-color);
  box-sizing: border-box;
}

/* BELOW HERO — brand */
.below-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--hero-max);
  margin: 0 auto;
  padding: 0 120px 0 0px;
  margin-bottom: -30px;
}
.user-greeting-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--white);
  border-radius: 14px;
  cursor: default;
  user-select: none;
}
.brand-icon { font-size: 22px; color: #111; }
.brand-text { font-weight: 800; letter-spacing: 0.2px; }

/* HERO layout */
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

.hero-title {
  font-size: clamp(40px, 6vw, 72px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: var(--text);
  margin: 0;
  text-align: left;
}
.hero-sub { margin-top: 16px; color: var(--subtext); font-size: 16px; max-width: 600px; text-align: left; }

.hero-link { margin-top: 10px; color: #7a7a7a; font-size: 14px; text-decoration: underline; width: fit-content; }

.hero-right { justify-self: center; }

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease-in-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Auth card */
.auth-card { width: 100%; max-width: 440px; background: #fff; border: 1px solid #eee; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,.08); overflow: hidden; min-height: 580px; }
.auth-tabs { display: flex; border-bottom: 1px solid #eee; }
.auth-tab { flex: 1; padding: 14px 16px; background: transparent; border: none; font-weight: 600; cursor: pointer; transition: background .15s ease; }
.auth-tab:hover { background: #fafafa; }
.auth-tab.active { background: #f7f7f7; border-bottom: 2px solid var(--button-color); }
.auth-body { padding: 20px 20px 24px; }
.auth-form { display: block; width: 100%; }

/* Responsive */
@media (max-width: 980px) {
  .page-content { padding-left: 16px; }
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 56px; padding-bottom: 24px; }
  .hero-right { justify-self: stretch; display: flex; justify-content: center; }
}
</style>
