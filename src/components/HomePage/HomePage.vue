<template>
  <div class="page-content">
    <!-- BELOW HERO -->
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

        <!-- TOGGLING CONTENT -->
        <div class="toggle-space">
          <transition name="fade" mode="out-in">
            <RotatingGreeting
              v-if="heroView === 'greeting'"
              key="greeting"
            />
            <TaskLoadCalendar
              v-else
              key="taskload"
            />
          </transition>
        </div>

        <!-- CTA + LINK (ALIGNED) -->
        <div class="hero-ctas">
          <div class="cta-row">
            <button
              class="btn btn-primary"
              @click="showPlanModal = true"
            >
              Plan My Day
            </button>

            <button
              class="btn btn-secondary"
              @click="toggleHeroView"
            >
              {{ heroView === 'taskload' ? 'Daily Greetings' : 'Monthly' }}
            </button>
          </div>

          <a href="#" class="hero-link">
            Need help? Visit the guide.
          </a>
        </div>
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
import { defineComponent, ref } from "vue";

import DashBoard from "../DashBoard.vue";
import UserGreeting from "./UserGreeting.vue";
import RotatingGreeting from "./RotatingGreeting.vue";
import TaskLoadCalendar from "./TaskLoadCalendar.vue";
import TodayCard from "./TodayCard.vue";
import UiBadge from "./UiBadge.vue";

import BaseModal from "@/components/Ui/BaseModal.vue";
import PlanMyDayForm from "./PlanMyDayForm.vue";

export default defineComponent({
  name: "HomePage",
  components: {
    DashBoard,
    UserGreeting,
    RotatingGreeting,
    TaskLoadCalendar,
    TodayCard,
    UiBadge,
    BaseModal,
    PlanMyDayForm,
  },
  setup() {
    const heroView = ref<"greeting" | "taskload">("greeting");
    const showPlanModal = ref(false);

    const toggleHeroView = () => {
      heroView.value =
        heroView.value === "taskload" ? "greeting" : "taskload";
    };

    const handlePlanSubmit = () => {
      showPlanModal.value = false;
    };

    return {
      heroView,
      toggleHeroView,
      showPlanModal,
      handlePlanSubmit,
    };
  },
});
</script>

<style scoped>
.page-content {
  min-height: 100vh;
  width: 100%;
  padding: 50px 50px 0px 150px;
  box-sizing: border-box;
}

/* BELOW HERO */
.below-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 120px 0px;
}

.user-greeting-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

/* HERO */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px 40px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}

.hero-left {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.toggle-space {
  min-height: 400px;
  max-height: 400px;
}

.badges {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* CTA FIX */
.hero-ctas {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: 28px;
}

.cta-row {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: var(--button-color);
  color: var(--secondary-text-color);
}

.btn-secondary {
  background: #ffffff;
  color: #121212;
  border-color: #e8e8e8;
}

.hero-link {
  font-size: 14px;
  text-decoration: underline;
  color: #7a7a7a;
}

/* RIGHT */
.hero-right {
  justify-self: center;
}

/* FADE TRANSITION */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* RESPONSIVE */
@media (max-width: 980px) {
  .page-content {
    padding-left: 16px;
  }

  .hero {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-right {
    display: flex;
    justify-content: center;
  }
}
</style>
