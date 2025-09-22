<!-- src/components/HomePage/TodayCard.vue -->
<template>
  <div class="card-wrap">
    <div class="card-glow"></div>
    <div class="card">
      <!-- Header -->
      <div class="row header-row">
        <div class="muted">{{ todayLabel }}</div>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="avatar">
          <img :src="currentMoodSrc" alt="" />
        </div>
        <div class="big right">{{ completed }} / {{ total }} tasks</div>
      </div>

      <!-- Next up -->
      <div class="mini">
        <div class="mini-top">Next up · {{ nextTime || '—' }}</div>
        <div class="mini-main">
          <div class="mini-title" :title="nextTitle || '—'">
            {{ nextTitle || '—' }}
          </div>
          <div v-if="nextTask" class="actions">
            <button
              type="button"
              class="action-btn yes"
              :class="{ active: nextTask.status === 'done' }"
              @click="setStatus(nextTask, 'done')"
              aria-label="Mark next task done"
              title="Mark done"
            >✓</button>
            <button
              type="button"
              class="action-btn no"
              :class="{ active: nextTask.status === 'not_done' }"
              @click="setStatus(nextTask, 'not_done')"
              aria-label="Mark next task not done"
              title="Mark not done"
            >✕</button>
          </div>
        </div>
      </div>

      <!-- Task list -->
      <div class="tasklist">
        <template v-if="allTasks.length">
          <ul class="tlist">
            <!-- Columns: Header (title) | Content (note) | Date | ✓/✕ -->
            <li v-for="(t, i) in allTasks" :key="t.id || i" class="trow">
              <div class="cell head" :title="t.title">
                {{ t.title }}
              </div>
              <div class="cell body" :title="t.note || ''">
                {{ t.note || '—' }}
              </div>
              <div class="cell date">
                {{ t.date }}
              </div>
              <div class="cell actions">
                <button
                  type="button"
                  class="action-btn yes"
                  :class="{ active: t.status === 'done' }"
                  @click="setStatus(t, 'done')"
                  aria-label="Mark task done"
                  title="Mark done"
                >✓</button>
                <button
                  type="button"
                  class="action-btn no"
                  :class="{ active: t.status === 'not_done' }"
                  @click="setStatus(t, 'not_done')"
                  aria-label="Mark task not done"
                  title="Mark not done"
                >✕</button>
              </div>
            </li>
          </ul>
        </template>
        <template v-else>
          <div class="empty">
            Ops seems you have nothing to do today, you sure or you just want to relax, wink wink
          </div>
        </template>
      </div>

      <!-- Plan (replaces reminder). Shows Personal and/or Team for current slot.
           Hidden entirely if neither exists. -->
      <div v-if="personalPlanNow || teamPlanNow" class="plan-col">
        <div v-if="personalPlanNow" class="plan-line" :title="personalPlanNow.title">
          <div class="plan-left">
            <span class="plan-slot">{{ personalPlanNow.slot }}</span>
            <span class="dash">—</span>
            <span class="plan-text">{{ personalPlanNow.title }}</span>
          </div>
          <div class="plan-day">{{ todayDow }}</div>
        </div>

        <div v-if="teamPlanNow" class="plan-line" :title="teamPlanNow.title">
          <div class="plan-left">
            <span class="plan-slot">{{ teamPlanNow.slot }}</span>
            <span class="dash">—</span>
            <span class="plan-text">{{ teamPlanNow.title }}</span>
          </div>
          <div class="plan-day">{{ todayDow }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from "vue";
import { onTasksUpdated } from "@/utils/tasksBus";
import { supabase } from "@/lib/supabase";

import boredImg from "@/assets/moods/bored.png";
import happyImg from "@/assets/moods/happy.png";
import excitedImg from "@/assets/moods/excited.png";
import letsGoImg from "@/assets/moods/lets-go.png";
import godmodeImg from "@/assets/moods/godmode.png";

type TaskStatus = "done" | "not_done";

interface TaskRow {
  id: string;
  user_id: string;
  task_date: string;       // 'YYYY-MM-DD'
  title: string;
  note: string | null;
  type: string | null;
  task_time: string | null;      // 'HH:MM' or 'HH:MM:SS'
  reminder_time: string | null;  // 'HH:MM' or 'HH:MM:SS'
  priority: number | null;
  assigned_to: string | null;
  status: TaskStatus | null;
}
interface Task {
  id: string;
  date: string;
  time?: string;
  title: string;
  note?: string;
  type: string;
  priority: number;
  assignedTo: string;
  status: TaskStatus;
}

type Slot = "Morning" | "Afternoon" | "Night";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface PlanRow {
  id: string;
  day_of_week: Day;
  slot: Slot;
  title: string;
  notes: string | null;
  created_at?: string;
  owner_user_id?: string | null;
  team_id?: string | null;
}

export default defineComponent({
  name: "TodayCard",
  setup() {
    const toISO = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

    const today = new Date();
    const todayISO = toISO(today);

    const userId = ref<string | null>(null);
    const teamId = ref<string | null>(null);

    const tasks = ref<Task[]>([]);
    const loading = ref(true);

    // --- helpers
    const toMin = (t?: string) => {
      if (!t) return -1;
      const [h, m] = (t || "").split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const hhmm = (val: string | null) => {
      if (!val) return undefined;
      const [h, m] = val.split(":");
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    function dowLabel(d: Date): Day {
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] as Day;
    }
    const todayDow = dowLabel(today);

    function currentSlot(): Slot {
      const h = new Date().getHours();
      if (h < 12) return "Morning";
      if (h < 18) return "Afternoon";
      return "Night";
    }

    // --- identity
    async function loadIdentity() {
      const { data } = await supabase.auth.getSession();
      userId.value = data.session?.user.id ?? null;

      if (userId.value) {
        const { data: mems } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", userId.value)
          .order("created_at", { ascending: true });
        teamId.value = mems?.[0]?.team_id ?? null;
      }
    }

    // --- tasks
    async function loadTodayTasks() {
      if (!userId.value) { tasks.value = []; loading.value = false; return; }
      loading.value = true;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId.value)
        .eq("task_date", todayISO)
        .order("task_time", { ascending: true });

      if (error) {
        tasks.value = [];
      } else {
        tasks.value = (data as TaskRow[]).map((r) => ({
          id: r.id,
          date: r.task_date,
          time: hhmm(r.task_time),
          title: r.title,
          note: r.note || undefined,
          type: (r.type || "others"),
          priority: r.priority ?? 3,
          assignedTo: r.assigned_to || "",
          status: (r.status || "not_done") as TaskStatus,
        })).sort((a, b) => toMin(a.time) - toMin(b.time));
      }

      loading.value = false;
    }

    async function setStatus(task: Task, which: TaskStatus) {
      if (!task.id) return;
      const { error } = await supabase
        .from("tasks")
        .update({ status: which })
        .eq("id", task.id);

      if (!error) {
        const idx = tasks.value.findIndex((t) => t.id === task.id);
        if (idx !== -1) tasks.value.splice(idx, 1, { ...tasks.value[idx], status: which });
      }
    }

    // --- plan (personal + team) for current slot
    const personalPlanNow = ref<PlanRow | null>(null);
    const teamPlanNow = ref<PlanRow | null>(null);

    async function loadPlansForNow() {
      personalPlanNow.value = null;
      teamPlanNow.value = null;
      if (!userId.value) return;

      const slot = currentSlot();

      // personal
      const { data: pData } = await supabase
        .from("personal_plan_entries")
        .select("*")
        .eq("owner_user_id", userId.value)
        .eq("day_of_week", todayDow)
        .eq("slot", slot)
        .order("created_at", { ascending: false })
        .limit(1);

      personalPlanNow.value = (pData && pData[0]) ? (pData[0] as PlanRow) : null;

      // team
      if (teamId.value) {
        const { data: tData } = await supabase
          .from("team_plan_entries")
          .select("*")
          .eq("team_id", teamId.value)
          .eq("day_of_week", todayDow)
          .eq("slot", slot)
          .order("created_at", { ascending: false })
          .limit(1);

        teamPlanNow.value = (tData && tData[0]) ? (tData[0] as PlanRow) : null;
      }
    }

    // --- lifecycle
    let off: (() => void) | undefined;
    onMounted(async () => {
      await loadIdentity();
      await loadTodayTasks();
      await loadPlansForNow();
      off = onTasksUpdated(({ date }) => {
        if (!date || date === todayISO) loadTodayTasks();
      });
    });
    onBeforeUnmount(() => { off?.(); });

    // --- derived
    const allTasks = computed(() => tasks.value);

    const nowMins = () => {
      const n = new Date();
      return n.getHours() * 60 + n.getMinutes();
    };
    const upcomingOnly = computed(() =>
      tasks.value.filter((t) => (t.time ? toMin(t.time) >= nowMins() : true))
    );

    const nextTask = computed<Task | null>(() => {
      if (!upcomingOnly.value.length) return null;
      const timed = upcomingOnly.value.filter((t) => t.time && toMin(t.time) !== -1);
      return (timed.length ? timed : upcomingOnly.value)
        .slice()
        .sort((a, b) => toMin(a.time) - toMin(b.time))[0] || null;
    });

    const nextTitle = computed(() => nextTask.value?.title || "");
    const nextTime = computed(() => nextTask.value?.time || "");

    const total = computed(() => allTasks.value.length);
    const completed = computed(() => allTasks.value.filter((t) => t.status === "done").length);

    const todayLabel = computed(() =>
      new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })
    );

    const moodSrcs = {
      bored: boredImg,
      happy: happyImg,
      excited: excitedImg,
      "lets-go": letsGoImg,
      godmode: godmodeImg,
    } as const;

    const currentMood = computed(() => {
      const c = completed.value;
      if (c >= 4) return "godmode";
      if (c === 3) return "lets-go";
      if (c === 2) return "excited";
      if (c === 1) return "happy";
      return "bored";
    });

    const currentMoodSrc = computed(() => moodSrcs[currentMood.value as keyof typeof moodSrcs]);

    return {
      todayLabel,
      todayDow,
      total,
      completed,
      nextTitle,
      nextTime,
      nextTask,
      allTasks,
      setStatus,
      currentMoodSrc,
      personalPlanNow,
      teamPlanNow,
    };
  },
});
</script>

<style scoped>
.card-wrap { --card-w: 460px; --card-h: 540px; }

.card-glow {
  position: absolute; inset: -12px -12px -28px -12px;
  filter: blur(28px); border-radius: 28px; background: rgba(0,0,0,0.06); z-index: 0;
}
.card-wrap { position: relative; width: var(--card-w); }
.card {
  position: relative; z-index: 1; width: var(--card-w);
  min-height: var(--card-h);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 24px; background: rgba(255,255,255,0.82);
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  box-shadow: 0 40px 120px -20px rgba(0,0,0,0.25);
  padding: 20px; border: 1px solid rgba(255,255,255,0.6);
  background-color: rgba(var(--frame1-color), 0.3);
}

.row { display: flex; align-items: center; }
.row.gap { gap: 8px; }
/* Header row: left-aligned */
.header-row { justify-content: flex-start; }

.stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.big { font-size: 28px; font-weight: 800; color: #161616; }
.big.right { text-align: right; }

.avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.08);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  overflow: hidden;
  flex: 0 0 auto;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

.muted { font-size: 12px; color: #7a7a7a; }

.mini {
  background: rgba(255,255,255,0.75);
  border: 1px solid #ececec; border-radius: 14px;
  padding: 10px 12px; box-shadow: 0 6px 14px rgba(0,0,0,0.06);
}
.mini-top { font-size: 12px; color: #7a7a7a; margin-bottom: 2px; }
.mini-main { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mini-title {
  font-size: 14px; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.actions { display: flex; align-items: center; gap: 6px; }
.action-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #9aa0a6;
  font-weight: 800;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, border-color .15s ease, transform .1s ease;
}
.action-btn:hover { background: #f1f5f9; }
.action-btn:active { transform: scale(0.94); }
.action-btn.yes.active { background: #eafff0; color: #16a34a; border-color: #16a34a; }
.action-btn.no.active  { background: #ffecec; color: #d32f2f; border-color: #d32f2f; }

.tasklist { max-width: 500px; }

/* Scrollable list */
.tlist {
  --row-h: 48px;
  --gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--gap);
  max-height: calc(var(--row-h) * 4 + var(--gap) * 4);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.tlist::-webkit-scrollbar { display: none; }

/* Row columns: Header | Content | Date | Actions */
.trow {
  display: grid;
  grid-template-columns: 1.4fr 2fr 120px auto;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #222;
  background: rgba(255,255,255,0.7);
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 8px 10px;
  min-height: var(--row-h);
  text-align: left;
}
.cell { min-width: 0; }
.cell.head { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell.body { color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cell.date { font-size: 12px; color: #667085; white-space: nowrap; text-align: left; }
.cell.actions { display: flex; align-items: center; gap: 6px; justify-self: end; }

.empty {
  font-size: 13px;
  color: #555;
  background: rgba(255,255,255,0.7);
  border: 1px dashed #ececec;
  border-radius: 10px;
  padding: 12px;
}

/* ---- Plan section (replaces reminder) ---- */
.plan-col {
  margin-top: auto; /* stick towards bottom like the old reminder */
  display: grid;
  gap: 8px;
}

/* single line: SLOT — TEXT ......... DAY (right end) */
.plan-line {
  border: 1px solid #ececec;
  background: rgba(255,255,255,0.75);
  border-radius: 16px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* push day to the far right */
  gap: 12px;
}

.plan-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.plan-slot {
  font-weight: 700;
  color: #222;
  white-space: nowrap;
}
.dash { opacity: .6; color: #6b7280; }
.plan-text {
  color: #222;
  font-size: 14px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.plan-day {
  margin-left: auto;
  font-size: 12px;
  color: #667085;
  font-weight: 700;
  text-align: right; /* ensure right alignment */
  min-width: 3ch;   /* keeps it tidy for 3-letter days */
}

/* Hover grow + tilt — include plan-line */
.mini,
.trow,
.plan-line {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  transform-origin: center;
}
.mini:hover,
.trow:hover,
.plan-line:hover {
  transform: scale(1.03) rotateY(13deg);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

@media (max-width: 560px) {
  .trow { grid-template-columns: 1fr; align-items: start; }
  .cell.actions { justify-self: start; }
}
@media (max-width: 420px) {
  .card-wrap, .card { width: 100%; }
}
</style>
