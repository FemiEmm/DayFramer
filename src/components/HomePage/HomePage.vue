<template>
  <div class="page-content"><!-- offsets for sidebar -->
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
          <UiBadge icon="⏱️" label="Save 5–10 hrs/wk" />
          <UiBadge icon="✨" label="Smart suggestions" />
        </div>

        <!-- Rotating headline with fade transition -->
        <transition name="fade" mode="out-in">
          <h1
            class="hero-title"
            v-html="currentHeadline"
            :key="currentHeadline"
          ></h1>
        </transition>

        <p class="hero-sub">
          Stay on top of your tasks, take breaks when you need them, and let us handle the reminders.
        </p>

        <div class="hero-ctas">
          <!-- OPEN MODAL -->
          <button class="btn btn-primary" @click="showPlanModal = true">Plan My Day</button>
          <button class="btn btn-secondary">Add Task</button>
        </div>

        <a href="#" class="hero-link">Need help? Visit the guide.</a>
      </div>

      <!-- RIGHT -->
      <div class="hero-right">
        <TodayCard
          :completed="5"
          :total="8"
          :delta="2"
          next-title="Deep work: Portfolio case study"
          next-time="10:30 AM – 12:00 PM"
          :spark="[1,2,2,3,4,3,5,6,7,6]"
        />
      </div>
    </section>

    <!-- PLAN MY DAY MODAL -->
    <BaseModal v-model="showPlanModal" title="Plan My Day">
      <PlanMyDayForm
        @submit="handlePlanSubmit"
        @cancel="showPlanModal = false"
      />
    </BaseModal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from "vue";
import DashBoard from "../DashBoard.vue"; // untouched
import UserGreeting from "@/components/HomePage/UserGreeting.vue";
import TodayCard from "./TodayCard.vue";
import UiBadge from "./UiBadge.vue";

/* NEW: reusable modal + your plan form */
import BaseModal from "@/components/Ui/BaseModal.vue";
import PlanMyDayForm from "@/components/HomePage/PlanMyDayForm.vue"; // adjust path if you placed it elsewhere

export default defineComponent({
  name: "Homepage",
  components: { DashBoard, UserGreeting, TodayCard, UiBadge, BaseModal, PlanMyDayForm },
  setup() {
    // Headlines rotate every 30 seconds
    const headlines = [
      "Have you<br>planned your day?",
      "When are you<br>going grocery<br>shopping?",
      "What’s your<br>top priority today?",
      "Don’t forget to<br>take a break.<br>relax and rest.",
      "Any tasks you <br>can finish in<br>5 minutes?",
    ];
    const idx = ref(0);
    const currentHeadline = ref(headlines[idx.value]);
    let timer: number | undefined;

    onMounted(() => {
      timer = window.setInterval(() => {
        idx.value = (idx.value + 1) % headlines.length;
        currentHeadline.value = headlines[idx.value];
      }, 30000); // 30s
    });

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
    });

    // Modal state
    const showPlanModal = ref(false);

    // Handle form submit
    const handlePlanSubmit = (payload: { date: string; title: string; time: string; priority: number }) => {
      // TODO: save payload to your store/localStorage/api as needed
      // console.log("Plan payload:", payload);
      showPlanModal.value = false;
    };

    return { currentHeadline, showPlanModal, handlePlanSubmit };
  },
});
</script>

<style scoped>
:root {
  --sidebar-w: 72px;         /* adjust if your blue sidebar is wider */
  --hero-max: 1200px;
  --text: #121212;
  --subtext: #606060;
  --primary: #111111;
  --primary2: #444444;
  --white: #ffffff;
}

/* === page wrapper to avoid sidebar overlap === */
.page-content {
  min-height: 100vh;              /* ensure full screen height */
  width: 100%;                    /* span full width */
  padding: 50px 50px 0px 150px;
  background-color: var(--background-color);
  box-sizing: border-box;
}

/* Section layout */
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
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 16px 36px rgba(0,0,0,.22);
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

.hero-right { justify-self: center; 

}

/* BELOW HERO layout */
.below-hero {
  display: flex;
  justify-content: space-between; /* pushes greeting left, dashboard right */
  align-items: center;            /* vertically aligns them */
  max-width: var(--hero-max);
  margin: 0 auto;
  padding: 0 120px 0px;
}

.user-greeting-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end; /* pushes greeting to the right */
}

/* Fade transition for rotating headline */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.8s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 980px) {
  .page-content { padding-left: 16px; } /* sidebar likely collapses on mobile */
  .hero { grid-template-columns: 1fr; gap: 40px; padding-top: 56px; padding-bottom: 24px; }
  .hero-right { justify-self: stretch; display: flex; justify-content: center; }
}
</style>
