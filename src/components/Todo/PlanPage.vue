<template>
  <DashBoard />

  <section class="plan-wrap">
    <header class="plan-header">
      <h1 class="title">Plan</h1>

      <div class="scope">
        <button
          class="scope-btn"
          :class="{ active: scope==='personal' }"
          @click="setScope('personal')"
        >
          Personal
        </button>
        <button
          class="scope-btn"
          :class="{ active: scope==='team' }"
          @click="setScope('team')"
          :disabled="!teamId"
          :title="teamId ? '' : 'Join a team to enable Team Plan'"
        >
          Team
        </button>
      </div>

      <!-- Mode toggle: dot + text (View = green, Edit = blue) -->
      <button
        class="mode-toggle"
        :aria-pressed="isEdit"
        @click="toggleEdit"
        :title="isEdit ? 'Switch to view mode' : 'Switch to edit mode'"
      >
        <span class="mode-dot" :class="isEdit ? 'blue' : 'green'"></span>
        <span class="mode-text">{{ isEdit ? 'Edit mode' : 'View mode' }}</span>
      </button>
    </header>

    <div v-if="scope==='team' && !teamId" class="banner">
      You’re not in a team yet. Switch to <strong>Personal</strong> or join a team to use the Team Plan.
    </div>

    <!-- GRID: blank corner + 3 slot heads (top); 7 day rows (left) -->
    <div class="plan-grid">
      <!-- top-left blank spacer -->
      <div class="head head-blank"></div>

      <!-- slot headers -->
      <div v-for="s in SLOTS" :key="'head-'+s" class="head head-slot">
        {{ s }}
      </div>

      <!-- day rows -->
      <template v-for="d in DAYS" :key="d">
        <div class="head head-day">{{ d }}</div>

        <div v-for="s in SLOTS" :key="d+'-'+s" class="cell">
          <ul class="entries">
            <li v-for="e in entriesFor(d, s)" :key="e.id" class="entry">
              <span class="pill">{{ e.title }}</span>
              <button
                v-if="isEdit"
                class="del"
                @click="removeEntry(e)"
                aria-label="Delete"
                title="Delete"
              >×</button>
            </li>
          </ul>

          <form v-if="isEdit" class="adder" @submit.prevent="addEntry(d, s)">
            <input
              class="adder-input"
              :placeholder="`Add ${s.toLowerCase()} plan…`"
              v-model="drafts[cellKey(d,s)]"
            />
            <button class="adder-btn" type="submit" :disabled="loadingAdd">+</button>
          </form>
        </div>
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import DashBoard from "@/components/DashBoard.vue";
import { supabase } from "@/lib/supabase";

type Slot = "Morning" | "Afternoon" | "Night";
type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type PlanRow = {
  id: string;
  day_of_week: Day;
  slot: Slot;
  title: string;
  notes: string | null;
  owner_user_id?: string | null;
  team_id?: string | null;
};

const DAYS: Day[] = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS: Slot[] = ["Morning","Afternoon","Night"];

const scope = ref<"personal" | "team">("personal");
function setScope(v: "personal"|"team") { scope.value = v; loadRows(); }

/* Edit/View toggle */
const isEdit = ref(false);
function toggleEdit() { isEdit.value = !isEdit.value; }

const uid = ref<string | null>(null);
const teamId = ref<string | null>(null);

const rows = ref<PlanRow[]>([]);
const loadingAdd = ref(false);
const drafts = ref<Record<string,string>>({});
const cellKey = (d: Day, s: Slot) => `${d}__${s}`;

const tableName = computed(() =>
  scope.value === "personal" ? "personal_plan_entries" : "team_plan_entries"
);

function entriesFor(d: Day, s: Slot) {
  return rows.value.filter(r => r.day_of_week === d && r.slot === s);
}

async function loadIdentity() {
  const { data } = await supabase.auth.getSession();
  uid.value = data.session?.user?.id ?? null;
  if (uid.value) {
    const { data: mems } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", uid.value);
    teamId.value = mems?.[0]?.team_id ?? null;
  }
}

async function loadRows() {
  rows.value = [];
  if (!uid.value) return;

  let q = supabase.from(tableName.value).select("*")
    .order("day_of_week")
    .order("slot")
    .order("created_at");

  if (scope.value === "personal") {
    q = q.eq("owner_user_id", uid.value);
  } else {
    if (!teamId.value) return;
    q = q.eq("team_id", teamId.value);
  }

  const { data, error } = await q;
  rows.value = error ? [] : (data as PlanRow[]);
}

async function addEntry(d: Day, s: Slot) {
  if (loadingAdd.value) return;
  const key = cellKey(d, s);
  const title = (drafts.value[key] || "").trim();
  if (!title || !uid.value) return;

  loadingAdd.value = true;

  const payload =
    scope.value === "personal"
      ? { owner_user_id: uid.value, day_of_week: d, slot: s, title, notes: null }
      : { team_id: teamId.value,      day_of_week: d, slot: s, title, notes: null };

  const { data: ins, error } = await supabase
    .from(tableName.value)
    .insert(payload)
    .select()
    .maybeSingle();

  if (!error && ins) {
    rows.value.push(ins as unknown as PlanRow);
    drafts.value[key] = "";
  }

  loadingAdd.value = false;
}

async function removeEntry(e: PlanRow) {
  if (!isEdit.value) return;
  await supabase.from(tableName.value).delete().eq("id", e.id);
  rows.value = rows.value.filter(r => r.id !== e.id);
}

onMounted(async () => {
  await loadIdentity();
  await loadRows();
});

watch(teamId, () => { if (scope.value === "team") loadRows(); });

defineExpose({ reload: loadRows });
</script>

<style scoped>
.plan-wrap {
  width: 100%;
  min-height: 100vh;
  padding: 24px 24px 40px 120px; /* room for Dashboard sidebar */
  background: linear-gradient(
    to bottom,
    var(--background-secondary) 0 10%,
    var(--background-color) 10% 90%
  );
  box-sizing: border-box;
}

/* Header */
.plan-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 16px;
}
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--secondary-text-color);
}
.scope {
  display: flex;
  gap: 8px;
  margin-left: 8px;
}
.scope-btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--button-color);
  background: var(--secondary-button-color);
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
}
.scope-btn.active { background: var(--button-color); color: #fff; }
.scope-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Mode toggle (dot + label) aligned to the far right */
.mode-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--frame1-color);
  background: var(--frame1-color);
  color: var(--primary-text-color);
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
}
.mode-toggle:hover { filter: brightness(0.98); }
.mode-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.mode-dot.green { background: #22c55e; } /* View mode */
.mode-dot.blue  { background: #3b82f6; } /* Edit mode */

/* Banner */
.banner {
  background: var(--frame1-color);
  border: 1px dashed var(--button-color);
  color: var(--primary-text-color);
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
}

/* Grid */
.plan-grid {
  display: grid;
  grid-template-columns: 140px repeat(3, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 10px;
  align-items: start;
  padding: 0px 50px 0px 0px;
}
.head {
  background: var(--frame1-color);
  color: var(--primary-text-color);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 14px;
  display: grid;
  place-items: center start;
  padding: 12px 14px;
  font-weight: 800;
}
.head-blank { background: transparent; border: none; }
.head-slot  { text-align: left; place-items: center; font-size: 14px; }
.head-day   { font-size: 14px; place-items: center; }

/* Cells */
.cell {
  background: var(--frame1-color);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.06);
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 10px;
  min-height: 120px;
}

/* Entries */
.entries { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.entry {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}
.pill {
  display: inline-block;
  
  color: var(--primary-text-color);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
   /* text-align: left;  
  justify-self: start;  */
}
.del {
  appearance: none;
  border: none;
  background: #fff;
  color: #d32f2f;
  width: 50px; height: 50px;
  border-radius: 100%;
  /* border: 1px solid #f0caca; */
  cursor: pointer;
}

/* Add form (only visible in edit mode) */
.adder {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
.adder-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
  background: #fff;
  color: #111;
}
.adder-btn {
  border: 1px solid var(--button-color);
  background: var(--button-color);
  color: #fff;
  border-radius: 10px;
  padding: 0 12px;
  font-weight: 800;
  cursor: pointer;
}
.adder-btn:disabled { opacity: .6; cursor: not-allowed; }

/* Responsive */
@media (max-width: 980px) {
  .plan-wrap { padding-left: 100px; }
  .plan-grid { grid-template-columns: 120px repeat(3, 1fr); }
  .cell { min-height: 110px; }
}
@media (max-width: 620px) {
  .plan-wrap { padding-left: 90px; }
  .plan-grid { grid-template-columns: 100px repeat(3, 1fr); }
}
</style>
