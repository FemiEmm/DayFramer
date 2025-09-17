<!-- src/components/HomePage/TodayCard.vue -->
<template>
  <div class="card-wrap">
    <div class="card-glow"></div>
    <div class="card">
      <div class="row between">
        <div class="row gap">
          <span class="dot dot-green"></span>
          <span class="chip-text">Focus mode</span>
        </div>
        <div class="muted">{{ todayLabel }}</div>
      </div>

      <div class="stats">
        <div class="avatar">
          <img :src="currentMoodSrc" alt="" />
        </div>
        <div class="big right">{{ completed }} / {{ total }} tasks</div>
      </div>

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

      <div class="tasklist">
        <template v-if="allTasks.length">
          <ul class="tlist">
            <li v-for="(t, i) in allTasks" :key="t.id || i" class="trow">
              <span class="tbullet">•</span>
              <span class="ttext" :title="t.title">
                <strong class="ttitle">{{ t.title }}</strong>
                <span v-if="t.note" class="tnote"> — {{ t.note }}</span>
              </span>
              <span class="ttime">{{ t.time || 'All-day' }}</span>
              <div class="actions">
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

      <div class="reminder row gap">
        <span class="dot dot-amber"></span>
        <div>
          <div class="rem-title">Reminder</div>
          <div class="rem-sub">Stand up &amp; stretch · 2 min</div>
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
    const tasks = ref<Task[]>([]);
    const loading = ref(true);

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

    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      userId.value = data.session?.user.id ?? null;
    }

    async function loadToday() {
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

    let off: (() => void) | undefined;
    onMounted(async () => {
      await loadUser();
      await loadToday();
      off = onTasksUpdated(({ date }) => {
        if (!date || date === todayISO) loadToday();
      });
    });
    onBeforeUnmount(() => { off?.(); });

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
      total,
      completed,
      nextTitle,
      nextTime,
      nextTask,
      allTasks,
      setStatus,
      currentMoodSrc,
    };
  },
});
</script>

<style scoped>
/* your existing styles unchanged */
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
.row.between { justify-content: space-between; }

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

.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-green { background: #22c55e; }
.dot-amber { background: #f59e0b; }
.chip-text { font-size: 12px; font-weight: 600; color: #3a3a3a; }
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

.tasklist { 
   max-width: 500px;
}

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

.trow {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #222;
  background: rgba(255,255,255,0.7);
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 8px 10px;
  min-height: var(--row-h);
}
.tbullet { width: 10px; text-align: center; opacity: .6; }
.ttext { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ttitle { font-weight: 700; }
.tnote { color: #6b7280; font-weight: 400; display: inline-block; max-width: 40ch; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ttime { font-size: 12px; color: #667085; margin-left: 8px; white-space: nowrap; }

.empty {
  font-size: 13px;
  color: #555;
  background: rgba(255,255,255,0.7);
  border: 1px dashed #ececec;
  border-radius: 10px;
  padding: 12px;
}

.reminder {
  margin-top: auto;
  border: 1px solid #ececec;
  background: rgba(255,255,255,0.75); border-radius: 16px; padding: 10px 12px;
}
.rem-title { font-weight: 600; font-size: 14px; color: #222; }
.rem-sub { font-size: 12px; color: #7a7a7a; }

/* Hover grow + tilt */
.mini,
.trow,
.reminder {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  transform-origin: center;
}
.mini:hover,
.trow:hover,
.reminder:hover {
  transform: scale(1.03) rotateY(13deg);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

@media (max-width: 420px) { .card-wrap, .card { width: 100%; } }
</style>
