<!-- src/components/Monthly.vue (or your current file) -->
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
          @click="goToDay(cell.iso)"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="goToDay(cell.iso)"
          @keydown.space.prevent="goToDay(cell.iso)"
        >
          <div class="day-head">
            <span class="num">{{ cell.day }}</span>
          </div>

          <ul class="tasks">
            <li
              v-for="(t, i) in twoClosestTasks(cell.iso)"
              :key="t.id || i"
              class="pbar"
              :class="priorityClass(t.priority || 3)"
              :title="t.title"
            >
              <span class="ptitle">{{ t.title }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import DashBoard from "../DashBoard.vue";
import { supabase } from "@/lib/supabase";

type Priority = 1 | 2 | 3 | 4 | 5;
type DbTask = {
  id: string;
  user_id: string;
  task_date: string;       // YYYY-MM-DD
  title: string;
  note: string | null;
  type: string | null;
  task_time: string | null;      // 'HH:MM' or 'HH:MM:SS' depending on your schema
  priority: number | null;
  assigned_to: string | null;
  status: "done" | "not_done" | null;
};
type UiTask = {
  id: string;
  date: string;
  time: string | null;     // HH:MM
  title: string;
  note: string | null;
  type: string | null;
  priority: Priority | null;
  assignedTo: string | null;
  status: "done" | "not_done" | null;
};

const router = useRouter();
const weekStartsOn: 0 | 1 = 1; // Monday

/* ------------ date helpers ------------ */
const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const jsDow = (d: Date) => d.getDay();
const offsetForWeekStart = (dow: number) =>
  weekStartsOn === 1 ? ((dow + 6) % 7) : dow;

const todayISO = toISO(new Date());
const monthAnchor = ref<string>(
  toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
);

const monthDate = computed(() => parseISO(monthAnchor.value));
const monthLabel = computed(() =>
  monthDate.value.toLocaleDateString(undefined, { month: "long", year: "numeric" })
);
const weekdays = computed(() =>
  weekStartsOn === 1
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
);

/* ------------ grid (always 6x7) ------------ */
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

/* Range for the grid (start ISO and end ISO) */
const gridStartISO = computed(() => cells.value[0]?.iso || monthAnchor.value);
const gridEndISO = computed(() => cells.value[cells.value.length - 1]?.iso || monthAnchor.value);

/* ------------ Supabase state ------------ */
const userId = ref<string | null>(null);
const byDate = ref<Record<string, UiTask[]>>({}); // date -> tasks[] for grid range
const loading = ref(false);
const errorMsg = ref("");

function trimHHMM(s: string | null): string | null {
  if (!s) return null;
  // handles 'HH:MM:SS', 'HH:MM:SS+00', 'HH:MM'
  const m = s.match(/^(\d{2}:\d{2})/);
  return m ? m[1] : s;
}

async function loadUser() {
  const { data } = await supabase.auth.getSession();
  userId.value = data.session?.user.id ?? null;
}

/* Fetch all tasks for the visible grid */
async function loadRange() {
  errorMsg.value = "";
  byDate.value = {};
  if (!userId.value) return;

  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, user_id, task_date, title, note, type, task_time, priority, assigned_to, status")
      .eq("user_id", userId.value)
      .gte("task_date", gridStartISO.value)
      .lte("task_date", gridEndISO.value);

    if (error) throw error;

    const map: Record<string, UiTask[]> = {};
    for (const r of (data || []) as DbTask[]) {
      const dt = r.task_date;
      (map[dt] ||= []).push({
        id: r.id,
        date: dt,
        time: trimHHMM(r.task_time),
        title: r.title,
        note: r.note,
        type: r.type,
        priority: (r.priority as Priority) ?? 3,
        assignedTo: r.assigned_to,
        status: r.status ?? "not_done",
      });
    }

    // sort each day by time ascending (no-time last)
    const toMin = (t?: string | null) => {
      if (!t) return 24 * 60 + 1;
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => toMin(a.time) - toMin(b.time));
    });

    byDate.value = map;
  } catch (e: any) {
    errorMsg.value = e?.message || "Failed to load tasks.";
    byDate.value = {};
  } finally {
    loading.value = false;
  }
}

/* When user or month changes, reload */
watch([userId, monthAnchor, gridStartISO, gridEndISO], () => {
  if (userId.value) loadRange();
});

/* ------------ per-cell helpers ------------ */
const nowMinutesOfDay = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};
const toMinStrict = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/* pick 2 nearest upcoming tasks relative to "now"; no-time are deprioritized */
function twoClosestTasks(iso: string): UiTask[] {
  const list = (byDate.value[iso] || []).slice();
  if (!list.length) return [];
  const now = nowMinutesOfDay();
  const dist = (t: UiTask) => {
    const m = toMinStrict(t.time);
    return m === null ? Number.POSITIVE_INFINITY : Math.abs(m - now);
  };
  list.sort((a, b) => {
    const da = dist(a), db = dist(b);
    if (da !== db) return da - db;
    const ma = toMinStrict(a.time), mb = toMinStrict(b.time);
    if (ma !== mb) return (ma ?? 99999) - (mb ?? 99999);
    return a.title.localeCompare(b.title);
  });
  return list.slice(0, 2);
}
function priorityClass(p: Priority | null) {
  return `level-${p || 3}`;
}

/* nav */
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

/* click → Dayframer with date */
function goToDay(iso: string) {
  router.push({ name: "Dayframer", query: { date: iso } });
}

/* init */
onMounted(async () => {
  await loadUser();
  await loadRange();
});
</script>

<style scoped>
/* (unchanged styles) */
.month-page {
  min-height: 100vh;
  background: linear-gradient(
    to bottom,
    var(--background-secondary) 0 30%,
    var(--background-color) 30% 100%
  );
  color: var(--primary-text-color, #333);
  display: grid;
  grid-auto-rows: min-content 1fr;
}
.wrap {
  width: min(1200px, 100% - 48px);
  margin: 16px auto;
  background: var(--background-color, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  padding: 12px;
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: calc(100vh - 32px);
}
.topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; margin-bottom: 8px; }
.title { text-align: center; font-size: 18px; font-weight: 800; letter-spacing: .02em; margin: 0; }
.nav { display: flex; gap: 6px; }
.btn { padding: 6px 10px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; color: #111; cursor: pointer; }
.btn:hover { background: #f6f6f6; }
.spacer { width: 64px; }
.dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 6px; }
.dow { text-align: center; font-size: 12px; color: #6b7280; font-weight: 700; }
.grid { display: grid; grid-template-columns: repeat(7, 1fr); grid-template-rows: repeat(6, 1fr); gap: 6px; min-height: 0; }
.day { background: var(--frame1-color, #fff); border: 1px solid #ececec; border-radius: 10px; display: grid; grid-template-rows: auto 1fr; overflow: hidden; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; min-height: 0; }
.day:hover { transform: scale(1.02); box-shadow: 0 8px 20px rgba(0,0,0,.08); }
.day.dim { opacity: .55; }
.day.today { border-color: var(--button-color, #111); box-shadow: 0 0 0 2px rgba(0,0,0,.05) inset; }
.day-head { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px 0 8px; }
.num { font-weight: 800; font-size: 13px; }
.tasks { margin: 6px 8px 8px 8px; padding: 0; list-style: none; display: grid; gap: 6px; overflow: hidden; }
.pbar { display: block; width: 100%; border-radius: 8px; padding: 6px 8px; font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.level-1 { background: #22c55e; } .level-2 { background: #84cc16; } .level-3 { background: #f59e0b; }
.level-4 { background: #fb923c; } .level-5 { background: #ef4444; }
@media (max-width: 900px) { .wrap { width: min(100%, 100% - 24px); } }
</style>
