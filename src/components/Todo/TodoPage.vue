<template>
  <div class="month-page">
    <DashBoard />

    <section class="wrap">
      <header class="topbar">
        <div class="nav">
          <button class="btn" @click="goPrev">‹</button>
          <button class="btn" @click="goToday">Today</button>
          <button class="btn" @click="goNext">›</button>
        </div>
        <h1 class="title">{{ monthLabel }}</h1>
        <div class="spacer"></div>
      </header>

      <div class="dow-row">
        <div v-for="d in weekdays" :key="d" class="dow">{{ d }}</div>
      </div>

      <div class="grid">
        <div
          v-for="cell in cells"
          :key="cell.iso"
          class="day"
          :class="{ dim: !cell.inMonth, today: cell.iso === todayISO }"
        >
          <div class="day-head">
            <span class="num">{{ cell.day }}</span>
          </div>

          <ul class="taskchips">
            <li
              v-for="(t, i) in tasksForDate(cell.iso)"
              :key="t.id || i"
              class="chip"
              :style="{ '--accent': typeColor(t.type) }"
              :title="taskTitle(t)"
            >
              <span class="dot" />
              <span class="txt">
                <strong class="t">{{ t.title }}</strong>
                <span v-if="t.time" class="time"> · {{ t.time }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from "vue";
import DashBoard from "../DashBoard.vue";

type TaskType = "meeting" | "health" | "home" | "others";
type Priority = 1 | 2 | 3 | 4 | 5;
interface Task {
  id?: string;
  date: string;     // YYYY-MM-DD
  time?: string;    // HH:mm
  title: string;
  note?: string;
  type: TaskType;
  priority: Priority;
  assignedTo: string;
  completed?: boolean;
  status?: "done" | "not_done";
}

const STORAGE_KEY = "dayframer.tasks.v1";
const weekStartsOn: 0 | 1 = 1; // 0 = Sun, 1 = Mon (per your earlier usage)

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const todayISO = toISO(new Date());
const monthAnchor = ref<string>(toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));

const monthDate = computed(() => parseISO(monthAnchor.value));
const monthLabel = computed(() =>
  monthDate.value.toLocaleDateString(undefined, { month: "long", year: "numeric" })
);
const weekdays = computed(() =>
  weekStartsOn === 1 ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
);

const jsDow = (d: Date) => d.getDay();
const offsetForWeekStart = (dow: number) => (weekStartsOn === 1 ? (dow + 6) % 7 : dow);

// Build 6-week grid
const cells = computed(() => {
  const first = new Date(monthDate.value.getFullYear(), monthDate.value.getMonth(), 1);
  const ofs = offsetForWeekStart(jsDow(first));
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - ofs);
  const yr = first.getFullYear();
  const mo = first.getMonth();
  const arr: Array<{ iso: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push({ iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === mo });
  }
  return arr;
});

// Storage
const store = reactive<{ byDate: Record<string, Task[]> }>({ byDate: {} });

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"byDate":{}}');
    store.byDate = raw.byDate || {};
  } catch {
    store.byDate = {};
  }
}
function onStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY) loadStore();
}

onMounted(() => {
  loadStore();
  window.addEventListener("storage", onStorage);
});
onBeforeUnmount(() => window.removeEventListener("storage", onStorage));

// Month navigation
function goPrev() {
  const d = new Date(monthDate.value);
  d.setMonth(d.getMonth() - 1);
  monthAnchor.value = toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}
function goNext() {
  const d = new Date(monthDate.value);
  d.setMonth(d.getMonth() + 1);
  monthAnchor.value = toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}
function goToday() {
  const n = new Date();
  monthAnchor.value = toISO(new Date(n.getFullYear(), n.getMonth(), 1));
}

// Helpers
const toMin = (t?: string) => {
  if (!t) return 24 * 60 + 1;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
function tasksForDate(iso: string): Task[] {
  const list = (store.byDate[iso] || []).slice();
  return list.sort((a, b) => toMin(a.time) - toMin(b.time));
}
function typeColor(t: TaskType) {
  return (
    {
      meeting: "#2b8efc",
      health: "#db4d8d",
      home: "#f6a623",
      others: "#9e9e9e",
    }[t] || "#9e9e9e"
  );
}
const taskTitle = (t: Task) => `${t.title}${t.time ? ` • ${t.time}` : ""}`;
</script>

<style scoped>
.month-page {
  min-height: 100vh;
  background: var(--background-gradient, linear-gradient(135deg, #fff, #e0f7fa));
  color: var(--primary-text-color, #333);
  display: grid;
  grid-auto-rows: min-content 1fr;
}

/* content */
.wrap {
  width: min(1200px, 100% - 48px);
  margin: 16px auto 40px;
  background: var(--background-color, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  padding: 16px;
}

/* top bar */
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.title {
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: .02em;
  margin: 0;
}
.nav { display: flex; gap: 8px; }
.btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  cursor: pointer;
}
.btn:hover { background: #f6f6f6; }
.spacer { width: 72px; }

/* weekdays row */
.dow-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}
.dow {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}

/* grid */
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

/* day cell */
.day {
  background: var(--frame1-color, #fff);
  border: 1px solid #ececec;
  border-radius: 10px;
  min-height: 120px;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
}
.day.dim { opacity: .55; }
.day.today { border-color: var(--button-color, #111); box-shadow: 0 0 0 2px rgba(0,0,0,.05) inset; }

.day-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px 0 10px;
}
.num {
  font-weight: 800;
  font-size: 13px;
}

/* task chips inside a day */
.taskchips {
  list-style: none;
  margin: 6px 8px 10px 8px;
  padding: 0;
  display: grid;
  gap: 6px;
  overflow: auto;
  max-height: 140px;
}
.chip {
  --accent: #9e9e9e;
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(255,255,255,0.75);
  border: 1px solid #ececec;
  border-radius: 999px;
  font-size: 12px;
  color: #222;
  white-space: nowrap;
}
.chip .dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
}
.chip .t { font-weight: 700; }
.chip .time { color: #667085; }

@media (max-width: 900px) {
  .wrap { width: min(100%, 100% - 24px); }
  .day { min-height: 100px; }
}
</style>
