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
        <section class="right-bottom"></section>
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
.df-wrap {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(to bottom, var(--background-secondary) 0 30%, var(--background-color) 30% 100%);
  display: grid;
  place-items: start stretch;
  padding: 20px 0 40px;
}
.dayframer {
  width: 100%;
  padding-left: 100px;
  padding-right: 0;
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 16px;
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
  align-items: stretch;
}
.df-left,
.df-right {
  background: var(--background-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08);
  position: relative;
  z-index: 2;
}
.df-left {
  display: grid;
  grid-template-rows: 20% 80%;
  height: 100%;
  overflow: hidden;
  row-gap: 8px;
  padding: 50px;
}
.left-top,
.left-bottom { overflow: auto; }
.df-left > section + section {
  border-top: 1px solid var(--divider-color, #e6e6e6);
  padding-top: 8px;
}
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
  overflow: auto;
  border-radius: 8px;
}
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
.df-right > * { min-height: 0; }
.df-left  > * { min-height: 0; }
</style>
