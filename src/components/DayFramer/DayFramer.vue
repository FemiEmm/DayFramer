<!-- src/components/HomePage/DayFramer.vue -->
<template>
  <DashBoard />
  <section class="df-wrap">
    <div class="dayframer">
      <aside class="df-left">
        <section class="left-top">
          <DateDisplay :date="selectedDate" />
        </section>
        <section class="left-bottom">
          <TaskListForDate :date="selectedDate" />
        </section>
      </aside>

      <main class="df-right">
        <section class="right-top">
          <div class="calendar-shell">
            <CalendarMonth
              class="calendar-month"
              v-model="selectedDate"
              :week-starts-on="1"
              @date-selected="onDateSelected"
            />
          </div>
        </section>

        <section class="right-bottom">
          <!-- add anything else you want here -->
        </section>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DashBoard from "../DashBoard.vue";
import CalendarMonth from "./CalendarMonth.vue";
import TaskListForDate from "./TaskListForDate.vue";
import DateDisplay from "./DateDisplay.vue";

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const props = defineProps<{ initialDate?: string }>();
const selectedDate = ref<string>(props.initialDate || toISO(new Date()));

function onDateSelected(iso: string) {
  selectedDate.value = iso;
}
</script>

<style scoped>
/* ===== Outer layout fills the viewport without clipping ===== */
.df-wrap {
  width: 100%;
  height: 100vh;              /* fill the viewport */
  box-sizing: border-box;     /* include padding in height so nothing gets clipped */
  background: linear-gradient(
    to bottom,
    var(--background-secondary) 0 30%,
    var(--background-color) 30% 100%
  );
  display: grid;
  place-items: start stretch;
  padding: 20px 50px 40px 0;  /* safe because of border-box */
  overflow: hidden;           /* prevent page scrollbar */
}

/* Inner grid stretches to wrapper height */
.dayframer {
  width: 100%;
  height: 100%;
  min-height: 0;              /* allow children to shrink */
  padding-left: 100px;
  padding-right: 0;
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 15px;
  position: relative;
  z-index: 1;
  align-items: stretch;
}

/* Cards */
.df-left,
.df-right {
  background: var(--background-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08);
  position: relative;
  z-index: 2;
  min-height: 0;             /* critical for nested scrollables */
}

/* Ensure children can scroll without forcing the page to scroll */
.df-right > *,
.df-left  > * { min-height: 0; }

/* Left column: header + list */
.df-left {
  display: grid;
  grid-template-rows: 15% 85%;
  height: 100%;
  overflow: hidden;
  row-gap: 5px;
  padding: 50px;
}

/* Sections scroll internally (scrollbars hidden) */
.left-top,
.left-bottom,
.right-top,
.right-bottom {
  overflow: auto;
  scrollbar-width: none;     /* Firefox */
  -ms-overflow-style: none;  /* IE/old Edge */
}
.left-top::-webkit-scrollbar,
.left-bottom::-webkit-scrollbar,
.right-top::-webkit-scrollbar,
.right-bottom::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.df-left > section + section {
  border-top: 1px solid var(--divider-color, #e6e6e6);
  padding-top: 8px;
}

/* Right column split */
.df-right {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  height: 100%;
  min-height: 0;
}
.df-right > section + section {
  border-top: 1px solid var(--divider-color, #e6e6e6);
  padding-top: 8px;
}
.right-top,
.right-bottom {
  border-radius: 8px;
}

/* Calendar container */
.calendar-shell {
  width: 100%;
  max-height: 100%;
  display: flex;
  align-items: flex-start;
}
.calendar-month {
  width: 100%;
  height: auto;
}

/* Optional responsive tweak */
@media (max-width: 980px) {
  .dayframer {
    grid-template-columns: 1fr;
    padding-left: 20px;
    gap: 12px;
  }
  .df-right {
    grid-template-rows: auto;
  }
}
</style>
