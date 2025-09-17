<template>
  <section class="cal-month">
    <!-- TOP ROW: actions -->
    <div class="action-bar">
      <button class="btn plan" @click="showPlanMyDay = true">Plan Day</button>
      <button class="btn add">Add Task</button>
    </div>

    <!-- CALENDAR: header + grid -->
    <header class="cal-head">
      <button class="icon" @click="prevMonth" aria-label="Previous month">‹</button>
      <div class="title">{{ monthLabel.toUpperCase() }}</div>
      <button class="icon" @click="nextMonth" aria-label="Next month">›</button>
    </header>

    <div class="dow-row">
      <div v-for="d in weekdays" :key="d" class="dow">{{ d }}</div>
    </div>

    <div class="grid">
      <button
        v-for="cell in cells"
        :key="cell.iso"
        class="cell"
        :class="{ dim: !cell.inMonth, today: cell.iso === todayISO, selected: cell.iso === selected }"
        @click="select(cell.iso)"
      >
        <span class="num">{{ cell.day }}</span>
      </button>
    </div>

    <!-- MODAL: Plan My Day -->
    <BaseModal v-model="showPlanMyDay" title="Plan My Day">
      <PlanMyDayForm
        :date="selected"
        @submit="showPlanMyDay = false"
        @cancel="showPlanMyDay = false"
      />
    </BaseModal>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import PlanMyDayForm from "@/components/HomePage/PlanMyDayForm.vue";

const props = defineProps<{
  modelValue?: string;
  weekStartsOn?: 0 | 1; // 0=Sun (default), 1=Mon
}>();
const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "date-selected", v: string): void;
  (e: "plan-day"): void;
  (e: "add-task"): void;
}>();

/* local flag to show the modal */
const showPlanMyDay = ref(false);

/* date utils */
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const parseISO = (iso: string) => {
  const [y, m, d] = (iso || "").split("-").map(Number);
  return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
};
const firstOfMonthISO = (iso: string) => {
  const d = parseISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
};
const addMonths = (iso: string, n: number) => {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
};

/* state */
const weekStart = props.weekStartsOn ?? 0;
const todayISO = toISO(new Date());
const selected = ref<string>(props.modelValue || todayISO);
watch(() => props.modelValue, (v) => { if (v) selected.value = v; });

const monthAnchor = ref<string>(firstOfMonthISO(selected.value));
watch(selected, (v) => (monthAnchor.value = firstOfMonthISO(v)));

/* computed */
const weekdays = computed(() =>
  weekStart === 1
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
);

const monthLabel = computed(() =>
  parseISO(monthAnchor.value).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
);

const cells = computed(() => {
  const first = parseISO(monthAnchor.value);
  const yr = first.getFullYear();
  const mo = first.getMonth();
  const jsDow = first.getDay();
  const offset = weekStart === 1 ? (jsDow + 6) % 7 : jsDow;
  const start = new Date(yr, mo, 1 - offset);

  const arr: Array<{ iso: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push({ iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === mo });
  }
  return arr;
});

/* actions */
function select(iso: string) {
  selected.value = iso;
  emit("update:modelValue", iso);
  emit("date-selected", iso);
}
function prevMonth() { monthAnchor.value = addMonths(monthAnchor.value, -1); }
function nextMonth() { monthAnchor.value = addMonths(monthAnchor.value, +1); }
</script>

<style scoped>
.cal-month {
  background: var(--background-color);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: var(--cal-gap, 10px);

  grid-template-rows:
    auto
    auto
    auto
    minmax(0, 1fr);

  height: 100%;
  min-height: 0;
}

/* Action bar */
.action-bar { display:flex; gap:8px; justify-content:flex-end; }
.btn {
  padding:8px 12px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#fff;
  color:#111;
  font-size:12px;
  cursor:pointer;
}
.btn.plan {
  background: var(--button-color);
  color:#fff;
  border-color: var(--button-color);
}

/* Calendar header */
.cal-head{ display:flex; align-items:center; justify-content:space-between; }
.title{ font-weight:800; font-size:12px; letter-spacing:.08em; }
.icon{
  width:28px; height:28px; border-radius:999px; border:none; background:transparent;
  display:grid; place-items:center; font-size:16px; cursor:pointer;
}

/* Weekdays */
.dow-row{ display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.dow{ text-align:center; font-size:10px; opacity:.7; }

/* Grid */
.grid{
  display:grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, minmax(0, 1fr));
  gap:2px;
  min-height: 0;
  overflow: hidden;
}

/* Cells */
.cell{
  position:relative;
  background:transparent;
  border:none;
  border-radius:10px;
  display:grid; place-items:center;
  padding: var(--cal-cell-pad, 6px);
  cursor:pointer;

  min-height: 0;
  min-width: 0;
}
.cell.dim{ opacity:.45; }
.num{ position:relative; z-index:1; font-size:12px; font-weight:700; line-height:1; }
.cell.today .num{ color: var(--button-hover-color); }
.cell.selected .num{ color:#fff; }
.cell.selected .num::before{
  content:""; position:absolute; inset:-8px -8px; border-radius:999px;
  background: var(--button-color); z-index:-1;
}
</style>
