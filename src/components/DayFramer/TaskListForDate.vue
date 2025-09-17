<!-- src/components/HomePage/TasksForDate.vue -->
<template>
  <!-- Renders nothing when there are no tasks for the date -->
  <ul v-if="list.length" class="rows">
    <li
      v-for="(t, idx) in list"
      :key="t.id || idx"
      :class="['row', levelClass(t.priority)]"
    >
      <!-- left accent strip -->
      <div class="accent"></div>

      <!-- 1) title + note (note under title) -->
      <div class="col titlecol">
        <!-- VIEW MODE -->
        <template v-if="taskKey(t) !== editingKey">
          <div class="title" :title="t.title">{{ t.title }}</div>
          <p v-if="t.note" class="note" :title="t.note">{{ t.note }}</p>
        </template>

        <!-- EDIT MODE -->
        <template v-else>
          <input
            v-model="editTitle"
            class="edit-input"
            type="text"
            :placeholder="t.title || 'Title'"
          />
          <textarea
            v-model="editNote"
            class="edit-textarea"
            rows="2"
            :placeholder="t.note || 'Add a note…'"
          ></textarea>

          <div class="edit-actions">
            <button class="btn-save" type="button" @click="saveEdit(t)">Save</button>
            <button class="btn-cancel" type="button" @click="cancelEdit">Cancel</button>
          </div>
        </template>
      </div>

      <!-- 2) Due time (replaces date) -->
      <div class="col when">
        <div class="line">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="ico">
            <path d="M12 6v6l4 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/>
          </svg>
          <span class="text">Due {{ t.time || 'All-day' }}</span>
        </div>
      </div>

      <!-- 3) assignee (name only) -->
      <div class="col person">
        <div class="name">{{ t.assignedTo }}</div>
      </div>

      <!-- actions: edit + delete -->
      <div class="col go">
        <button
          class="tfd-edit"
          type="button"
          :title="`Edit '${t.title}'`"
          aria-label="Edit task"
          @click="beginEdit(t)"
          v-if="taskKey(t) !== editingKey"
        >
          ✎
        </button>

        <button
          class="del"
          type="button"
          :title="`Delete '${t.title}'`"
          aria-label="Delete task"
          @click="deleteTask(t)"
        >
          ×
        </button>
      </div>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref, watch, computed, onMounted } from "vue";
import { supabase } from "@/lib/supabase";

type TaskType = "meeting" | "health" | "home" | "others" | string;
type Priority = 1 | 2 | 3 | 4 | 5;
interface Task {
  id: string;        // UUID from Supabase
  date: string;      // 'YYYY-MM-DD'  (maps to task_date)
  time?: string;     // 'HH:MM'       (maps to task_time)
  title: string;
  note?: string;
  type: TaskType;
  priority: Priority;
  assignedTo: string;
}

const props = defineProps<{ date: string }>();

/* ===== State ===== */
const userId = ref<string | null>(null);
const raw = ref<Task[]>([]);
const loading = ref(false);
const err = ref("");

/* ===== Auth + Fetch ===== */
async function loadUser() {
  const { data } = await supabase.auth.getSession();
  userId.value = data.session?.user.id ?? null;
}

function toHHMM(val: string | null): string | undefined {
  if (!val) return undefined;
  // Handles "HH:MM" or "HH:MM:SS"
  const parts = val.split(":");
  if (parts.length >= 2) return `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}`;
  return val;
}

async function loadFromSupabase() {
  if (!userId.value || !props.date) { raw.value = []; return; }
  loading.value = true;
  err.value = "";

  const { data, error } = await supabase
    .from("tasks")
    .select("id, task_date, task_time, title, note, type, priority, assigned_to")
    .eq("user_id", userId.value)
    .eq("task_date", props.date)
    .order("task_time", { ascending: true });

  if (error) {
    err.value = error.message || "Failed to load tasks.";
    raw.value = [];
  } else {
    raw.value = (data || []).map((r: any) => ({
      id: r.id,
      date: r.task_date,
      time: toHHMM(r.task_time) || undefined,
      title: r.title,
      note: r.note || undefined,
      type: r.type || "others",
      priority: (r.priority ?? 3) as Priority,
      assignedTo: r.assigned_to || "",
    }));
  }
  loading.value = false;
}

onMounted(async () => {
  await loadUser();
  await loadFromSupabase();
});
watch(() => props.date, loadFromSupabase);

/* ===== Helpers ===== */
const toMin = (t?: string) => {
  if (!t) return -1; // All-day first
  const [h, m] = (t || "").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const list = computed(() =>
  raw.value.slice().sort((a, b) => toMin(a.time) - toMin(b.time))
);

/* Priority class helper */
const levelClass = (p?: Priority) => `level-${p ?? 3}`;

/* Unique key (we have Supabase id) */
const taskKey = (t: Task) => t.id;

/* Edit state */
const editingKey = ref<string | null>(null);
const editTitle = ref<string>("");
const editNote = ref<string>("");

/* ===== Edit actions (update Supabase) ===== */
function beginEdit(task: Task) {
  editingKey.value = taskKey(task);
  editTitle.value = task.title || "";
  editNote.value = task.note || "";
}

function cancelEdit() {
  editingKey.value = null;
  editTitle.value = "";
  editNote.value = "";
}

async function saveEdit(task: Task) {
  if (!task.id) return cancelEdit();
  const title = editTitle.value.trim() || task.title;
  const note = editNote.value.trim() || null;

  const { error } = await supabase
    .from("tasks")
    .update({ title, note })
    .eq("id", task.id);

  if (!error) {
    const idx = raw.value.findIndex((x) => x.id === task.id);
    if (idx !== -1) raw.value.splice(idx, 1, { ...raw.value[idx], title, note: note || undefined });
  }
  cancelEdit();
}

/* ===== Delete (Supabase) ===== */
async function deleteTask(task: Task) {
  if (!task.id) return;
  const { error } = await supabase.from("tasks").delete().eq("id", task.id);
  if (!error) raw.value = raw.value.filter((t) => t.id !== task.id);
}
</script>

<style scoped>
.rows {
  list-style: none;
  margin: 0;
  padding: 20px 10px;
  display: grid;
  gap: 10px;
  width: 100%;
  max-width: 1200px;
}

/* card row */
.row {
  /* fallback accent if no class is applied */
  --accent: #9e9e9e;

  position: relative;
  background: var(--frame1-color);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,.10),
              0 2px 6px rgba(0,0,0,.06);
  display: grid;
  grid-template-columns: 1.6fr 1.0fr 1.0fr auto; /* title | due | assignee | actions */
  align-items: start;
  gap: 12px;
  padding: 14px 16px;
  overflow: hidden;
  text-align: left;
  transition: box-shadow .18s ease, transform .18s ease;
}
.row:hover {
  box-shadow: 0 16px 40px rgba(0,0,0,.14), 0 4px 10px rgba(0,0,0,.08);
  transform: translateY(-1px);
}

/* left accent strip uses --accent */
.row .accent {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 6px;
  background: var(--accent);
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
}

/* Priority → sets the accent color */
.level-1 { --accent: #22c55e; } /* green  */
.level-2 { --accent: #84cc16; } /* lime   */
.level-3 { --accent: #f59e0b; } /* amber  */
.level-4 { --accent: #fb923c; } /* orange */
.level-5 { --accent: #ef4444; } /* red    */

/* column separators (soft) */
.col { min-width: 0; }
.col:not(.titlecol) {
  border-left: 1px solid rgba(0,0,0,.06);
  padding-left: 14px;
}

/* Title + Note */
.title {
  font-weight: 800;
  font-size: 16px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--primary-text-color);
}
.note {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--secondary-text-color);
}

/* Edit fields */
.edit-input,
.edit-textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
}
.edit-input:focus,
.edit-textarea:focus {
  border-color: var(--button-color, #1e88e5);
  box-shadow: 0 0 0 3px rgba(30,136,229,.15);
}
.edit-textarea { margin-top: 8px; resize: vertical; }

.edit-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.btn-save,
.btn-cancel {
  appearance: none;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
}
.btn-save {
  background: var(--button-color, #1e88e5);
  color: #fff;
  border-color: var(--button-color, #1e88e5);
}
.btn-cancel:hover { background: #f4f4f5; }

/* Due time column */
.when .line { display: flex; align-items: center; gap: 8px; }
.ico { width: 14px; height: 14px; opacity: .75; }
.text { font-size: 12px; color: #667085; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Assignee (name only) */
.person { display: flex; align-items: center; }
.name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

 /* Right actions */
.go {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  /* background-color: #d32f2f; */
}

/* edit button (pencil) */
.tfd-edit {
  appearance: none;
  border: none;
  background: var(--button-color);
  color: var(--secondary-text-color);
  width: 50px; height: 50px;
  border-radius: 100px;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  display: grid; place-items: center;
  font-size: 14px; line-height: 1; font-weight: 700;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, transform .1s ease, box-shadow .15s ease;
}
.tfd-edit:hover {
  background: var(--button-hover-color);
  color: var(--primary-text-color);
  box-shadow: 0 4px 10px rgba(0,0,0,.10);
}
.edit:active { transform: scale(0.95); }

/* delete button (×) */
.del {
  appearance: none;
  border: none;
  background: var(--button-color);
  color: var(--secondary-text-color);
  width: 50px; height: 50px;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  display: grid; place-items: center;
  font-size: 18px; line-height: 1; font-weight: 700;
  cursor: pointer;
  transition: background .15s ease, color .15s ease, transform .1s ease, box-shadow .15s ease;
}
.del:hover {
  background: #ff0000;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(0,0,0,.10);
}
.del:active { transform: scale(0.95); }

/* Responsive collapse */
@media (max-width: 720px) {
  .row { grid-template-columns: 1fr auto; }
  .col.when { grid-column: 1 / -1; border-left: none; padding-left: 0; margin-top: 6px; }
  .col.person { grid-column: 1 / -1; border-left: none; padding-left: 0; margin-top: 6px; }
}
</style>
