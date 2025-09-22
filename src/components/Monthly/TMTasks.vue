<template>
  <section class="taskcard">
    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', { active: localTab==='monthly' }]" @click="setTab('monthly')">Monthly</button>
      <button :class="['tab', { active: localTab==='yearly' }]" @click="setTab('yearly')">Yearly</button>
    </div>

    <!-- Period pickers -->
    <div class="filters-row">
      <template v-if="localTab==='monthly'">
        <input type="month" v-model="localMonthYM" class="input" @change="emitMonth" />
      </template>
      <template v-else>
        <input
          type="number"
          v-model.number="localYearNum"
          class="input year-input"
          min="1970"
          max="2099"
          @change="emitYear"
        />
      </template>

      <select v-model="localFilterMemberId" class="input" @change="emitMember">
        <option :value="null">All members</option>
        <option v-for="m in members" :key="m.user_id" :value="m.user_id">{{ m.display_name }}</option>
      </select>

      <select v-model="localFilterType" class="input" @change="emitType">
        <option :value="null">All types</option>
        <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
      </select>

      <button class="btn" :disabled="loading" @click="$emit('refresh')">Refresh</button>
    </div>

    <!-- Long list (no internal height restriction / no internal scroll) -->
    <div class="scroll-area">
      <section class="tm-lists">
        <div v-for="group in groupedByDate" :key="group.key" class="date-block">
          <h3 class="mb-title">{{ group.key }}</h3>

          <ul class="task-list">
            <li
              v-for="t in group.tasks"
              :key="t.id"
              class="task-row"
              :class="rowClass(t)"
            >
              <!-- left accent strip -->
              <div class="accent"></div>

              <!-- Title + note -->
              <div class="col titlecol">
                <div class="title" :title="t.title">{{ t.title }}</div>
                <p class="note" :title="t.note || ''">{{ t.note || '—' }}</p>
              </div>

              <!-- Time -->
              <div class="col when">
                <div class="line">
                  <svg aria-hidden="true" viewBox="0 0 24 24" class="ico">
                    <path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
                  </svg>
                  <span class="text">{{ t.task_time || 'All-day' }}</span>
                </div>
              </div>

              <!-- Assignee -->
              <div class="col person">
                <div class="name">{{ displayNameForTask(t) }}</div>
              </div>

              <!-- Status -->
              <div class="col statuscol">
                <span v-if="isOverdue(t)" class="status-pill status-overdue">Overdue</span>
                <span v-else-if="t.status === 'done'" class="status-pill status-done">Done</span>
                <span v-else class="status-pill status-neutral">—</span>
              </div>

              <!-- Notification (Font Awesome bell) -->
              <div class="col go">
                <button class="icon-btn" type="button" aria-label="Notifications" title="Notifications">
                  <i class="fa-solid fa-bell" aria-hidden="true"></i>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <div v-if="loading" class="loading">Loading…</div>
      <div v-if="!loading && !tasks.length" class="empty">No tasks for this period.</div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

type Member = {
  user_id: string;
  display_name: string;
  role: "owner" | "admin" | "member";
};

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  type: string | null;
  task_date: string;
  task_time: string | null;
  reminder_time: string | null;
  priority: number | null;
  status: string | null;
  assigned_to: string | null;
};

const props = defineProps<{
  tab: "monthly" | "yearly";
  monthYM: string;
  yearNum: number;
  members: Member[];
  tasks: TaskRow[];
  loading: boolean;
  filterMemberId: string | null;
  filterType: string | null;
  typeOptions: string[];
}>();

const emit = defineEmits<{
  (e: "change-tab", v: "monthly" | "yearly"): void;
  (e: "change-month", v: string): void;
  (e: "change-year", v: number): void;
  (e: "change-filter-member", v: string | null): void;
  (e: "change-filter-type", v: string | null): void;
  (e: "refresh"): void;
}>();

const localTab = ref(props.tab);
const localMonthYM = ref(props.monthYM);
const localYearNum = ref(props.yearNum);
const localFilterMemberId = ref<string | null>(props.filterMemberId);
const localFilterType = ref<string | null>(props.filterType);

watch(() => props.tab, v => (localTab.value = v));
watch(() => props.monthYM, v => (localMonthYM.value = v));
watch(() => props.yearNum, v => (localYearNum.value = v));
watch(() => props.filterMemberId, v => (localFilterMemberId.value = v));
watch(() => props.filterType, v => (localFilterType.value = v));

function setTab(v: "monthly" | "yearly") { localTab.value = v; emit("change-tab", v); }
function emitMonth() { emit("change-month", localMonthYM.value); }
function emitYear() { emit("change-year", localYearNum.value); }
function emitMember() { emit("change-filter-member", localFilterMemberId.value); }
function emitType() { emit("change-filter-type", localFilterType.value); }

function isOverdue(t: TaskRow) {
  if (t.status === "done") return false;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tDate = new Date(t.task_date + "T00:00:00");
  if (tDate < todayDate) return true;
  if (tDate > todayDate) return false;
  if (!t.task_time) return false;
  const [hh, mm] = t.task_time.split(":").map(Number);
  return (hh * 60 + mm) < (today.getHours() * 60 + today.getMinutes());
}

const nameCache = computed(() => {
  const map: Record<string, string> = {};
  for (const m of props.members) map[m.user_id] = m.display_name;
  return map;
});

function displayNameForTask(t: TaskRow) {
  const map = nameCache.value;
  if (t.assigned_to) {
    if (map[t.assigned_to]) return map[t.assigned_to];
    return t.assigned_to;
  }
  return map[t.user_id] || "Unknown";
}

const groupedByDate = computed(() => {
  const groups: Record<string, { key: string; tasks: TaskRow[] }> = {};
  for (const t of props.tasks) {
    const key = t.task_date;
    (groups[key] ||= { key, tasks: [] }).tasks.push(t);
  }
  return Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));
});

function rowClass(t: TaskRow) {
  const p = t.priority ?? 3;
  return [`level-${p}`];
}
</script>

<style scoped>
.taskcard{
  /* allow content to grow naturally */
  height: auto;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  overflow: visible; /* was hidden; would clip long lists */
  min-height: 0;
}

/* Tabs row */
.tabs {
  display:flex;
  gap:6px;
  margin-bottom:12px;
  justify-content:center;
  align-items:center;
}

/* Default tabs (Monthly/Yearly) */
.tab {
  padding: 6px 12px;
  border:1px solid #e5e7eb;
  border-radius:999px;
  background:#fff;
  cursor:pointer;
  font-weight:700;
  font-size:12px;
}
.tab.active {
  background:#111;
  color:#fff;
  border-color:#111;
}

/* Filters */
.filters-row {
  display:flex;
  gap:8px;
  align-items:center;
  flex-wrap:wrap;
  margin-bottom:16px;
  justify-content:center;
}
.input { padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; font:inherit; background:#fff; }
.year-input { width:110px; }
.btn { padding:8px 12px; border-radius:10px; border:1px solid #111; background:#111; color:#fff; cursor:pointer; }

/* Long list container: no internal scroll/limits */
.scroll-area {
  overflow: visible;   /* let page/parent handle scrolling */
}

/* Date group */
.tm-lists { display:grid; gap:10px; }
.date-block { border:none; padding:0; }
.mb-title { margin:0 0 10px; font-weight:800; }

/* Task rows */
.task-list { list-style:none; padding:0; margin:0; display:grid; gap:12px; }

.task-row {
  --accent: #9e9e9e;
  position: relative;
  background: var(--frame1-color);
  border-radius:16px;
  box-shadow:0 10px 30px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.06);
  display:grid;
  grid-template-columns:1.8fr 1.0fr 1.0fr 0.8fr auto;
  align-items:start;
  gap:12px;
  padding:14px 16px;
  overflow:hidden;
  text-align:left;
  transition:box-shadow .18s ease, transform .18s ease;
}
.task-row:hover {
  box-shadow:0 16px 40px rgba(0,0,0,.14), 0 4px 10px rgba(0,0,0,.08);
  transform:translateY(-1px);
}
.task-row .accent {
  position:absolute; left:0; top:0; bottom:0; width:6px;
  background:var(--accent);
  border-top-left-radius:16px; border-bottom-left-radius:16px;
}

/* Priority colors */
.level-1 { --accent:#22c55e; }
.level-2 { --accent:#84cc16; }
.level-3 { --accent:#f59e0b; }
.level-4 { --accent:#fb923c; }
.level-5 { --accent:#ef4444; }

/* Columns */
.col { min-width:0; }
.col:not(.titlecol) { border-left:1px solid rgba(0,0,0,.06); padding-left:14px; }

.title { font-weight:800; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--primary-text-color); }
.note { margin-top:6px; font-size:12px; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; color:var(--secondary-text-color); }

.when .line { display:flex; align-items:center; gap:8px; }
.ico { width:14px; height:14px; opacity:.75; }
.text { font-size:12px; color:#667085; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.person { display:flex; align-items:center; }
.name { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.statuscol { display:flex; align-items:center; }
.status-pill { flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; min-width:64px; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid #e5e7eb; }
.status-overdue { background:#fee2e2; color:#b91c1c; border-color:#fecaca; }
.status-done { background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
.status-neutral { background:#f3f4f6; color:#6b7280; }

/* Actions */
.go { display:flex; align-items:center; gap:8px; }
.icon-btn {
  display:flex; align-items:center; justify-content:center;
  width:40px; height:40px; border-radius:50%;
  border:1px solid #e5e7eb; background:#fff; cursor:pointer;
}
.icon-btn i { font-size:18px; line-height:1; }
.icon-btn:hover { background:#f9fafb; }
.icon-btn:active { background:#f3f4f6; }

/* Empty/loading */
.loading, .empty { margin-top:8px; color:#666; text-align:center; }

/* Responsive */
@media (max-width:720px) {
  .task-row { grid-template-columns:1fr auto; }
  .col.when, .person, .statuscol { grid-column:1 / -1; border-left:none; padding-left:0; margin-top:6px; }
}
</style>
