<!-- src/components/HomePage/PlanMyDayForm.vue -->
<template>
  <div class="plan-form-grid">
    <!-- LEFT: form -->
    <div class="form-left">
      <h2 class="title">
        What do you want to do — <span class="date">{{ selectedDateFormatted }}</span>
      </h2>

      <label class="field">
        <span class="label">Date</span>
        <input v-model="selectedDateISO" class="input" type="date" />
      </label>

      <label class="field">
        <span class="label">To do</span>
        <input v-model="newTask.title" class="input" type="text" placeholder="Short title (max 50 chars)" maxlength="50" />
      </label>

      <label class="field">
        <span class="label">Notes</span>
        <textarea v-model="newTask.note" class="input textarea" placeholder="Optional details (max 200 chars)" maxlength="200" rows="3" />
      </label>

      <label class="field">
        <span class="label">Type</span>
        <select v-model="newTask.type" class="input">
          <option value="Meeting">Meeting</option>
          <option value="Health">Health</option>
          <option value="Home">Home</option>
          <option value="Home & Household">Home & Household</option>
          <option value="Health & Wellness">Health & Wellness</option>
          <option value="Family">Family</option>
          <option value="Finance & Bills">Finance & Bills</option>
          <option value="Learning and Growth">Learning and Growth</option>
          <option value="Appointments">Appointments</option>
          <option value="Others">Others</option>
        </select>
      </label>

      <label class="field">
        <span class="label">Assign To</span>
        <select v-model="newTask.assignedTo" class="input" :disabled="assignDisabled">
          <option value="" disabled>Select member</option>
          <option v-for="m in teamMembers" :key="m.user_id" :value="m.display_name">
            {{ m.display_name }}
          </option>
        </select>
        <small v-if="assignHelp" class="muted">{{ assignHelp }}</small>
      </label>

      <div class="field field-grid-2">
        <div class="subfield">
          <span class="label">Time</span>
          <TimeField v-model="newTask.time" :step="5" />
        </div>
        <div class="subfield">
          <span class="label">Reminder Time</span>
          <TimeField v-model="newTask.reminder" :step="5" />
        </div>
      </div>

      <div class="field">
        <div class="label-row">
          <span class="label">Priority</span>
          <span class="priority-value">Level {{ newTask.priority }}</span>
        </div>
        <div class="slider-row">
          <span class="priority-end">Low</span>
          <input v-model.number="newTask.priority" type="range" min="1" max="5" step="1" class="slider" />
          <span class="priority-end">High</span>
        </div>
        <div class="ticks"><span v-for="n in 5" :key="n">{{ n }}</span></div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button class="btn btn-primary" :disabled="!canStage" @click="stageTask">Add Task</button>
      </div>

      <p v-if="err" class="err">{{ err }}</p>
    </div>

    <!-- RIGHT: preview + saved -->
    <div class="form-right">
      <h3 class="preview-title">Tasks for {{ selectedDateFormatted }}</h3>

      <!-- Pending (unsaved) -->
      <div v-if="stagedSorted.length">
        <div class="pending-header">
          <strong>Pending (not saved)</strong>
          <button class="btn btn-primary btn-approve" :disabled="saving" @click="approveAll">
            {{ saving ? 'Saving…' : `Approve ${stagedSorted.length}` }}
          </button>
        </div>
        <ul class="task-list">
          <li v-for="(task, i) in stagedSorted" :key="`s-${i}`" class="task-item pending">
            <div class="task-content">
              <h4 class="task-title">{{ task.title }}</h4>
              <div class="task-meta">
                <span class="meta-item">{{ task.time || '—' }}</span>
                <span class="meta-item">{{ capitalize(task.type) }}</span>
                <span class="meta-item">{{ task.assignedTo || 'Unassigned' }}</span>
              </div>
              <p v-if="task.note" class="task-note">{{ task.note }}</p>
            </div>
            <span :class="['priority-badge', `level-${task.priority}`]">P{{ task.priority }}</span>
          </li>
        </ul>
      </div>

      <!-- Saved from Supabase -->
      <div v-if="savedSorted.length" class="saved-block">
        <div class="saved-header"><strong>Saved</strong></div>
        <ul class="task-list">
          <li v-for="t in savedSorted" :key="t.id" class="task-item">
            <div class="task-content">
              <h4 class="task-title">{{ t.title }}</h4>
              <div class="task-meta">
                <span class="meta-item">{{ t.task_time ?? '—' }}</span>
                <span class="meta-item">{{ capitalize(t.type) }}</span>
                <span class="meta-item">{{ t.assigned_to || 'Unassigned' }}</span>
              </div>
              <p v-if="t.note" class="task-note">{{ t.note }}</p>
            </div>
            <span :class="['priority-badge', `level-${t.priority || 3}`]">P{{ t.priority || 3 }}</span>
          </li>
        </ul>
      </div>

      <div v-if="!stagedSorted.length && !savedSorted.length && !loading" class="empty-state">
        No tasks yet.
      </div>
      <div v-if="loading" class="empty-state">Loading…</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import TimeField from "@/components/Ui/TimeField.vue";
import { notifyTasksUpdated } from "@/utils/tasksBus";
import { supabase } from "@/lib/supabase";

type SavedTask = {
  id: string;
  user_id: string;
  task_date: string;
  title: string;
  note: string | null;
  type: string | null;
  task_time: string | null;
  reminder_time: string | null;
  priority: number | null;
  assigned_to: string | null;
  status: string | null;
};

type StagedTask = {
  title: string;
  note: string;
  type: string;
  time: string;
  reminder: string;
  priority: number;
  assignedTo: string; // display_name
};

type Member = { user_id: string; display_name: string; role: "owner" | "admin" | "member" };

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDateLabel(iso: string) {
  const [y,m,dd] = iso.split("-").map(Number);
  const dt = new Date(y, (m-1), dd);
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function hhmm(t: string | null): string | null {
  if (!t) return null;
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

export default defineComponent({
  name: "PlanMyDayForm",
  components: { TimeField },
  emits: ["cancel", "submit"],
  setup() {
    const todayISO = toISO(new Date());
    const selectedDateISO = ref<string>(todayISO);
    const selectedDateFormatted = computed(() => formatDateLabel(selectedDateISO.value));

    const userId = ref<string | null>(null);
    const myName = ref<string>(""); // current user's display name
    const loading = ref(true);
    const saving  = ref(false);
    const err     = ref("");

    const stagedTasks = ref<StagedTask[]>([]);
    const savedTasks  = ref<SavedTask[]>([]);

    const teamMembers = ref<Member[]>([]);
    const inTeam = computed(() => teamMembers.value.length > 1 || (teamMembers.value.length === 1 && teamMembers.value[0].user_id !== userId.value ? true : false));
    // NOTE: we'll always push at least self; if only self exists, not "in team" logically, but assignment is still enabled.

    const newTask = ref<StagedTask>({
      title: "",
      note: "",
      type: "Meeting",
      time: "",
      reminder: "",
      priority: 3,
      assignedTo: "", // user will choose; we can prefill to self once names load
    });

    const assignDisabled = computed(() => !userId.value); // enabled as long as signed in
    const assignHelp = computed(() => {
      if (!userId.value) return "Sign in to assign tasks.";
      if (teamMembers.value.length === 1 && teamMembers.value[0].user_id === userId.value) return "No team yet — assigning to yourself.";
      return "";
    });

    const canStage = computed(() => !!newTask.value.title && !!newTask.value.time);

    const toMin = (t?: string | null) => {
      if (!t) return 24 * 60;
      const [h, m] = (t || "00:00").split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const stagedSorted = computed(() =>
      [...stagedTasks.value].sort((a, b) => toMin(a.time) - toMin(b.time))
    );
    const savedSorted = computed(() =>
      [...savedTasks.value].sort((a, b) => toMin(a.task_time) - toMin(b.task_time))
    );

    function capitalize(s?: string | null) {
      if (!s) return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // --- Auth + profile
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      userId.value = data.session?.user.id ?? null;
      if (!userId.value) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", userId.value)
        .maybeSingle();
      myName.value = prof?.display_name || "Me";
    }

    // --- Team + Members (fallback to self if no team)
    async function loadTeamMembers() {
      teamMembers.value = [];
      if (!userId.value) return;

      const { data: mems, error: memErr } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", userId.value);

      if (memErr || !mems?.length) {
        // Not in any team → allow assigning to self
        teamMembers.value = [{ user_id: userId.value, display_name: myName.value || "Me", role: "member" }];
        // prefill if empty
        if (!newTask.value.assignedTo) newTask.value.assignedTo = teamMembers.value[0].display_name;
        return;
      }

      const teamId = mems.find(m => m.role === "owner")?.team_id ?? mems[0].team_id;

      const { data: rawMembers } = await supabase
        .from("team_members")
        .select("user_id, role, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true });

      const ids = (rawMembers ?? []).map(r => r.user_id);
      let namesMap = new Map<string, string>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);
        namesMap = new Map((profs ?? []).map(p => [p.id, p.display_name || "User"]));
      }

      teamMembers.value = (rawMembers ?? []).map(r => ({
        user_id: r.user_id,
        role: r.role as Member["role"],
        display_name: namesMap.get(r.user_id) || "User",
      }));

      // prefill assignedTo to self if available
      const self = teamMembers.value.find(m => m.user_id === userId.value);
      if (self && !newTask.value.assignedTo) newTask.value.assignedTo = self.display_name;
    }

    // --- Tasks
    async function loadSavedForDate() {
      if (!userId.value) { loading.value = false; return; }
      loading.value = true;
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId.value)
        .eq("task_date", selectedDateISO.value)
        .order("task_time", { ascending: true });

      if (error) {
        err.value = "Failed to load tasks.";
        savedTasks.value = [];
      } else {
        savedTasks.value = (data || []).map((r: any) => ({
          ...r,
          task_time: hhmm(r.task_time),
          reminder_time: hhmm(r.reminder_time),
        })) as SavedTask[];
      }
      loading.value = false;
    }

    function stageTask() {
      if (!canStage.value) return;
      stagedTasks.value.push({ ...newTask.value });
      newTask.value = {
        title: "",
        note: "",
        type: "Meeting",
        time: "",
        reminder: "",
        priority: 3,
        assignedTo: teamMembers.value[0]?.display_name || "", // keep self selected for next add
      };
    }

    async function approveAll() {
      if (!userId.value || !stagedTasks.value.length) return;
      saving.value = true;
      err.value = "";

      try {
        const payloads = stagedTasks.value.map(s => ({
          user_id: userId.value,
          task_date: selectedDateISO.value,
          title: s.title,
          note: s.note || null,
          type: s.type || null,
          task_time: s.time || null,
          reminder_time: s.reminder || null,
          priority: s.priority || 3,
          assigned_to: s.assignedTo || null,
        }));

        const { data, error } = await supabase
          .from("tasks")
          .insert(payloads)
          .select();

        if (error) throw error;

        const inserted = (data || []).map((r: any) => ({
          ...r,
          task_time: hhmm(r.task_time),
          reminder_time: hhmm(r.reminder_time),
        })) as SavedTask[];

        savedTasks.value.push(...inserted);
        stagedTasks.value = [];
        notifyTasksUpdated(selectedDateISO.value);
      } catch (e: any) {
        err.value = e?.message || "Could not save tasks.";
      } finally {
        saving.value = false;
      }
    }

    onMounted(async () => {
      await loadUser();
      await Promise.all([loadTeamMembers(), loadSavedForDate()]);
      // if we have self-only list and no prefill, set assignedTo to self
      if (!newTask.value.assignedTo && teamMembers.value.length) {
        newTask.value.assignedTo = teamMembers.value[0].display_name;
      }
    });

    watch(selectedDateISO, async () => {
      stagedTasks.value = [];
      await loadSavedForDate();
    });

    return {
      selectedDateISO,
      selectedDateFormatted,

      newTask,
      canStage,
      stageTask,

      stagedTasks,
      stagedSorted,
      savedTasks,
      savedSorted,

      approveAll,
      capitalize,

      loading,
      saving,
      err,

      teamMembers,
      assignDisabled,
      assignHelp,
    };
  },
});
</script>

<style scoped>
:host, .plan-form-grid { font-size: 13px; }
.plan-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-left { display: flex; flex-direction: column; gap: 10px; }

.title { margin: 0 0 6px 0; font-weight: 800; font-size: 16px; }
.date { color: #666; font-weight: 600; }

.field { display: grid; gap: 4px; }
.field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.subfield { display: grid; gap: 4px; }
.label { font-size: 12px; color: #666; }
.input { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font: inherit; background: #fff; width: 100%; }
.textarea { resize: none; overflow: auto; min-height: 56px; }

.label-row { display: flex; justify-content: space-between; }
.priority-value { font-size: 11px; color: #666; }
.slider-row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
.priority-end { font-size: 11px; color: #666; }
.slider { width: 100%; }
.ticks { display: grid; grid-template-columns: repeat(5, 1fr); font-size: 10px; color: #888; text-align: center; margin-top: 2px; }

.actions { display: flex; justify-content: flex-end; gap: 6px; }
.btn { padding: 8px 12px; border-radius: 999px; border: 1px solid #e5e7eb; cursor: pointer; font-size: 12px; }
.btn-primary { background: #111; color: #fff; border-color: #111; }
.btn-secondary { background: #fff; color: #111; }

.form-right { background: #f9f9f9; border-radius: 10px; padding: 12px; overflow-y: auto; max-height: 420px; }
.preview-title { font-weight: 700; margin-bottom: 8px; font-size: 14px; }
.empty-state { font-size: 12px; color: #777; }

.pending-header, .saved-header {
  display: flex; align-items: center; justify-content: space-between;
  margin: 6px 0;
}
.btn-approve { padding: 6px 10px; border-radius: 10px; }

.task-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.task-item {
  background: #fff; border-radius: 8px; padding: 10px 12px;
  display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px;
}
.task-item.pending { border: 1px dashed #d1d5db; background: #fffef7; }
.task-content { min-width: 0; text-align: left; }
.task-title {
  margin: 0 0 2px 0; font-weight: 700; font-size: 15px; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.task-meta {
  display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: #666; line-height: 1.2;
  white-space: nowrap; overflow: hidden;
}
.meta-item { overflow: hidden; text-overflow: ellipsis; }
.meta-item + .meta-item { position: relative; padding-left: 10px; }
.meta-item + .meta-item::before { content: "•"; position: absolute; left: 0; top: 0; transform: translateY(1px); opacity: 0.8; }

.task-note { margin-top: 4px; font-size: 12px; color: #555; line-height: 1.3; word-break: break-word; }

.priority-badge { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; }
.level-1 { background: #4caf50; }
.level-2 { background: #8bc34a; }
.level-3 { background: #ffb300; }
.level-4 { background: #ff7043; }
.level-5 { background: #f44336; }

.muted { color:#666; font-size:11px; }

.err { color: #d32f2f; margin-top: 8px; }
</style>
