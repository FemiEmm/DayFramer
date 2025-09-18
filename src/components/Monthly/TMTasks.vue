<!-- src/components/TeamPage/TMTasks.vue -->
<template>
  <section>
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
        <input type="number" v-model.number="localYearNum" class="input year-input" min="1970" max="2099" @change="emitYear" />
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

    <!-- Lists grouped by assignee (name snapshot or creator fallback) -->
    <section class="tm-lists">
      <div v-for="group in groupedByAssignee" :key="group.key" class="member-block">
        <h3 class="mb-title">{{ group.display_name }}</h3>
        <ul class="task-list">
          <li
            v-for="t in group.tasks"
            :key="t.id"
            class="task-row"
            :class="{ overdue: isOverdue(t) }"
          >
            <div class="t-left">
              <div class="t-title">{{ t.title }}</div>
              <div class="t-meta">
                <span>{{ t.task_date }}</span>
                <span>{{ t.task_time || '—' }}</span>
                <span>{{ t.type || '—' }}</span>
              </div>
            </div>

            <div class="t-actions">
              <!-- Status pill replaces dropdown -->
              <span
                v-if="isOverdue(t)"
                class="status-pill status-overdue"
                title="Task is past due"
              >
                Overdue
              </span>
              <span
                v-else-if="t.status === 'done'"
                class="status-pill status-done"
                title="Task completed"
              >
                Done
              </span>
              <span v-else class="status-pill status-neutral" title="No status">
                —
              </span>

              <!-- Notification icon button (no-op for now) -->
              <button
                class="icon-btn"
                type="button"
                aria-label="Notifications"
                title="Notifications"
              >
                <!-- Inline bell icon -->
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
                  <path d="M9 21a3 3 0 0 0 6 0" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <div v-if="loading" class="loading">Loading…</div>
    <div v-if="!loading && !tasks.length" class="empty">No tasks for this period.</div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

type Member = { user_id: string; display_name: string; role: "owner"|"admin"|"member" };
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

// local copies to avoid mutating props directly
const localTab = ref(props.tab);
const localMonthYM = ref(props.monthYM);
const localYearNum = ref(props.yearNum);
const localFilterMemberId = ref<string|null>(props.filterMemberId);
const localFilterType = ref<string|null>(props.filterType);

// keep in sync if parent updates props
watch(() => props.tab, v => (localTab.value = v));
watch(() => props.monthYM, v => (localMonthYM.value = v));
watch(() => props.yearNum, v => (localYearNum.value = v));
watch(() => props.filterMemberId, v => (localFilterMemberId.value = v));
watch(() => props.filterType, v => (localFilterType.value = v));

function setTab(v: "monthly"|"yearly") { localTab.value = v; emit("change-tab", v); }
function emitMonth() { emit("change-month", localMonthYM.value); }
function emitYear()  { emit("change-year", localYearNum.value); }
function emitMember(){ emit("change-filter-member", localFilterMemberId.value); }
function emitType()  { emit("change-filter-type", localFilterType.value); }

function isOverdue(t: TaskRow) {
  if (t.status === "done") return false;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tDate = new Date(t.task_date + "T00:00:00");
  if (tDate < todayDate) return true;
  if (tDate > todayDate) return false;
  if (!t.task_time) return false;
  const [hh, mm] = t.task_time.split(":").map(Number);
  return (hh*60+mm) < (today.getHours()*60+today.getMinutes());
}

// group by assignee (assigned_to) or fallback to creator display name (from members)
const nameCache = computed(() => {
  const map: Record<string, string> = {};
  for (const m of props.members) map[m.user_id] = m.display_name;
  return map;
});

const groupedByAssignee = computed(() => {
  const groups: Record<string, { key: string; display_name: string; tasks: TaskRow[] }> = {};
  for (const t of props.tasks) {
    const key = t.assigned_to || nameCache.value[t.user_id] || "Unknown";
    const display = key;
    if (!groups[key]) groups[key] = { key, display_name: display, tasks: [] };
    groups[key].tasks.push(t);
  }
  return Object.values(groups);
});
</script>

<style scoped>
.tabs { display:flex; gap:6px; margin-bottom:8px; }
.tab {
  padding:6px 10px;border:1px solid #e5e7eb;border-radius:999px;background:#fff;
  cursor:pointer;font-weight:700;font-size:12px;
}
.tab.active { background:#111;color:#fff;border-color:#111; }

.filters-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
.input { padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;font:inherit;background:#fff; }
.year-input { width:110px; }
.btn { padding:8px 12px;border-radius:10px;border:1px solid #111;background:#111;color:#fff;cursor:pointer; }

.tm-lists { display:grid; gap:12px; }
.member-block { border:1px solid #eee; border-radius:12px; padding:12px; }
.mb-title { margin:0 0 8px; font-weight:800; }
.task-list { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
.task-row { display:grid; grid-template-columns: 1fr auto; gap:10px; border:1px solid #eee; border-radius:10px; padding:10px; }
.t-title { font-weight:700;}
.t-meta { display:flex; gap:10px; color:#666; font-size:12px; flex-wrap:wrap; }
.t-actions { display:flex; gap:8px; align-items:center; }

/* Status pills */
.status-pill {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:56px; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid #e5e7eb;
}
.status-overdue { background:#fee2e2; color:#b91c1c; border-color:#fecaca; }
.status-done { background:#ecfdf5; color:#065f46; border-color:#a7f3d0; }
.status-neutral { background:#f3f4f6; color:#6b7280; }

/* Icon button */
.icon-btn {
  display:inline-flex; align-items:center; justify-content:center;
  width:32px; height:32px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; color:#374151;
  cursor:pointer;
}
.icon-btn:hover { background:#f9fafb; }
.icon-btn:active { background:#f3f4f6; }

.loading, .empty { margin-top:8px; color:#666; }
</style>
