<template>
  <div class="task-load-calendar">
    <header class="calendar-header">
      <button class="nav-btn" @click="prevMonth">‹</button>
      <h3 class="month-label">
        {{ monthLabel }}
      </h3>
      <button class="nav-btn" @click="nextMonth">›</button>
    </header>

    <div class="weekdays">
      <span v-for="d in weekdays" :key="d">{{ d }}</span>
    </div>

    <div class="days-grid">
      <span
        v-for="n in leadingBlanks"
        :key="'blank-' + n"
        class="day blank"
      />

      <button
        v-for="day in daysInMonth"
        :key="day"
        class="day"
        :class="loadClass(day)"
        :title="dayTitle(day)"
      >
        {{ day }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { supabase } from "@/lib/supabase";

type TaskCountMap = Record<string, number>;

export default defineComponent({
  name: "TaskLoadCalendar",
  setup() {
    const today = new Date();
    const year = ref(today.getFullYear());
    const month = ref(today.getMonth()); // 0-based

    const taskCounts = ref<TaskCountMap>({});
    const loading = ref(false);

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const monthLabel = computed(() =>
      new Date(year.value, month.value).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    );

    const daysInMonth = computed(() =>
      new Date(year.value, month.value + 1, 0).getDate()
    );

    const firstDayOfMonth = computed(() => {
      const d = new Date(year.value, month.value, 1).getDay();
      return d === 0 ? 6 : d - 1; // Monday-first
    });

    const leadingBlanks = computed(() => firstDayOfMonth.value);

    function toISO(day: number) {
      return `${year.value}-${String(month.value + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    function loadClass(day: number) {
      const count = taskCounts.value[toISO(day)] || 0;
      if (count >= 9) return "red";
      if (count >= 6) return "orange";
      if (count >= 3) return "yellow";
      if (count > 0) return "green";
      return "empty";
    }

    function dayTitle(day: number) {
      const count = taskCounts.value[toISO(day)] || 0;
      return `${count} task${count === 1 ? "" : "s"}`;
    }

    async function loadMonth() {
      loading.value = true;
      taskCounts.value = {};

      const start = `${year.value}-${String(month.value + 1).padStart(2, "0")}-01`;
      const end = `${year.value}-${String(month.value + 1).padStart(2, "0")}-${daysInMonth.value}`;

      const { data, error } = await supabase
        .from("tasks")
        .select("task_date")
        .gte("task_date", start)
        .lte("task_date", end);

      if (!error && data) {
        for (const row of data) {
          taskCounts.value[row.task_date] =
            (taskCounts.value[row.task_date] || 0) + 1;
        }
      }

      loading.value = false;
    }

    function prevMonth() {
      if (month.value === 0) {
        month.value = 11;
        year.value--;
      } else {
        month.value--;
      }
    }

    function nextMonth() {
      if (month.value === 11) {
        month.value = 0;
        year.value++;
      } else {
        month.value++;
      }
    }

    onMounted(loadMonth);

    watch([month, year], loadMonth);

    return {
      weekdays,
      daysInMonth,
      leadingBlanks,
      monthLabel,
      loadClass,
      dayTitle,
      prevMonth,
      nextMonth,
    };
  },
});
</script>

<style scoped>
.task-load-calendar {
  width: 100%;
  max-width: 360px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.month-label {
  font-weight: 700;
  font-size: 14px;
}

.nav-btn {
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day {
  aspect-ratio: 1 / 1;
  border-radius: 999px;
  border: none;
  font-size: 12px;
  cursor: default;
  background: #eee;
}

.day.empty { background: #f0f0f0; }
.day.green { background: #4caf50; color: #fff; }
.day.yellow { background: #fbc02d; }
.day.orange { background: #fb8c00; color: #fff; }
.day.red { background: #e53935; color: #fff; }

.day.blank {
  background: transparent;
}
</style>
