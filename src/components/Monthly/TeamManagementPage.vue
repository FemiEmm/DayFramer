<!-- src/components/TeamPage/TeamManagementPage.vue -->
<template>
  <!-- ✅ Dashboard on top -->
  <DashBoard />

  <!-- ✅ Page background + grid like your DayFramer layout -->
  <section class="df-wrap">
    <div class="dayframer">
      <!-- LEFT CARD -->
      <aside class="df-left">
        <section class="left-top">
          <h2 class="section-title">Team Tasks</h2>
        </section>

        <section class="left-bottom">
          <TMTasks
            :tab="tab"
            :monthYM="monthYM"
            :yearNum="yearNum"
            :members="members"
            :tasks="tasks"
            :loading="loading"
            :filterMemberId="filterMemberId"
            :filterType="filterType"
            :typeOptions="typeOptions"
            @change-tab="(v) => (tab = v)"
            @change-month="(v) => (monthYM = v)"
            @change-year="(v) => (yearNum = v)"
            @change-filter-member="(v) => (filterMemberId = v)"
            @change-filter-type="(v) => (filterType = v)"
            @refresh="loadData"
          />
        </section>
      </aside>

      <!-- RIGHT CARD -->
      <main class="df-right">
        <section class="right-top">
          <TMMetrics
            :displayName="myName"
            :tasks="tasks"
            :userId="currentUserId"
          />
        </section>
        <section class="right-bottom">
          <!-- keep for future widgets (e.g., calendar, summaries) -->
        </section>
      </main>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import TMTasks from "./TMTasks.vue";
import TMMetrics from "./TMMetrics.vue";
import DashBoard from "@/components/DashBoard.vue";

type Member = { user_id: string; display_name: string; role: "owner"|"admin"|"member" };
type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  type: string | null;
  task_date: string;        // YYYY-MM-DD
  task_time: string | null; // HH:MM[:SS]
  reminder_time: string | null;
  priority: number | null;
  status: string | null;
  assigned_to: string | null; // display name snapshot
};

const loading = ref(false);
const tasks = ref<TaskRow[]>([]);
const members = ref<Member[]>([]);
const teamId = ref<string|null>(null);

// current user
const currentUserId = ref<string>("");
const myName = ref<string>("Me");

// UI state shared with TMTasks
const tab = ref<"monthly"|"yearly">("monthly");
const monthYM = ref<string>(new Date().toISOString().slice(0,7)); // YYYY-MM
const yearNum = ref<number>(new Date().getFullYear());

// filters
const filterMemberId = ref<string|null>(null);
const filterType = ref<string|null>(null);
const typeOptions = [
  "Meeting","Health","Home","Home & Household","Health & Wellness",
  "Family","Finance & Bills","Learning and Growth","Appointments","Others"
];

// derived range (internal)
const startISO = ref<string>("");
const endISO   = ref<string>("");

function computeRange() {
  if (tab.value === "monthly") {
    const [y, m] = monthYM.value.split("-").map(Number);
    const start = new Date(y, m-1, 1);
    const end = new Date(y, m, 0);
    startISO.value = start.toISOString().slice(0,10);
    endISO.value   = end.toISOString().slice(0,10);
  } else {
    const y = yearNum.value;
    startISO.value = new Date(y, 0, 1).toISOString().slice(0,10);
    endISO.value   = new Date(y, 11, 31).toISOString().slice(0,10);
  }
}

async function loadMembersAndTeam() {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess?.session?.user?.id;
  if (!uid) return;

  currentUserId.value = uid;

  // profile for display name
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", uid)
    .maybeSingle();
  myName.value = prof?.display_name || "Me";

  // memberships
  const { data: myMems } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", uid);

  if (!myMems?.length) {
    // just me
    members.value = [{ user_id: uid, display_name: myName.value, role: "member" }];
    teamId.value = null;
    return;
  }

  const tId = myMems.find(m => m.role === "owner")?.team_id ?? myMems[0].team_id;
  teamId.value = tId;

  const { data: rawMembers } = await supabase
    .from("team_members")
    .select("user_id, role, created_at")
    .eq("team_id", tId)
    .order("created_at", { ascending: true });

  const ids = (rawMembers ?? []).map(r => r.user_id);
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);

  const map = new Map((profs ?? []).map(p => [p.id, p.display_name || "User"]));
  members.value = (rawMembers ?? []).map(r => ({
    user_id: r.user_id,
    role: r.role as Member["role"],
    display_name: map.get(r.user_id) || "User",
  }));
}

async function loadData() {
  loading.value = true;
  computeRange();

  const memberIds   = members.value.map(m => m.user_id);
  const memberNames = members.value.map(m => m.display_name);

  if (filterMemberId.value) {
    const mm = members.value.find(x => x.user_id === filterMemberId.value);
    if (mm) {
      memberIds.splice(0, memberIds.length, mm.user_id);
      memberNames.splice(0, memberNames.length, mm.display_name);
    }
  }

  // A) tasks explicitly assigned by display name (compat with current schema)
  let resAssigned: TaskRow[] = [];
  if (memberNames.length) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("task_date", startISO.value)
      .lte("task_date", endISO.value)
      .in("assigned_to", memberNames);
    if (!error) resAssigned = (data ?? []) as TaskRow[];
  }

  // B) tasks created by those members (ID-based)
  let resCreated: TaskRow[] = [];
  if (memberIds.length) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("task_date", startISO.value)
      .lte("task_date", endISO.value)
      .in("user_id", memberIds);
    if (!error) resCreated = (data ?? []) as TaskRow[];
  }

  // merge + optional type filter + sort
  const byId = new Map<string, TaskRow>();
  for (const r of [...resAssigned, ...resCreated]) {
    if (filterType.value && r.type !== filterType.value) continue;
    byId.set(r.id, r);
  }

  tasks.value = Array.from(byId.values()).sort((a, b) => {
    if (a.task_date === b.task_date) return (a.task_time || "").localeCompare(b.task_time || "");
    return a.task_date.localeCompare(b.task_date);
  });

  loading.value = false;
}

onMounted(async () => {
  await loadMembersAndTeam();
  await loadData();
});
</script>

<style scoped>
/* --- Copied visual language from your DayFramer page --- */
.df-wrap {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(
    to bottom,
    var(--background-secondary) 0 30%,
    var(--background-color) 30% 100%
  );
  display: grid;
  place-items: start stretch;
  padding: 20px 0 40px;
}

.dayframer {
  width: 100%;
  padding-left: 100px;
  padding-right: 0;
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 16px;
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
  align-items: stretch;
}

.df-left,
.df-right {
  background: var(--background-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08);
  position: relative;
  z-index: 2;
}

/* Left splits header + content (like your reference) */
.df-left {
  display: grid;
  grid-template-rows: 20% 80%;
  height: 100%;
  overflow: hidden;
  row-gap: 8px;
  padding: 50px; /* matches your example */
}

.left-top,
.left-bottom { overflow: auto; }

.df-left > section + section {
  border-top: 1px solid var(--divider-color, #e6e6e6);
  padding-top: 8px;
}

/* Right splits two panels (metrics on top, room below) */
.df-right {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.df-right > section + section {
  border-top: 1px solid var(--divider-color, #e6e6e6);
  padding-top: 8px;
}

.right-top,
.right-bottom {
  overflow: auto;
  border-radius: 8px;
}

.section-title {
  margin: 0;
  font-weight: 800;
  font-size: 18px;
}

/* Keep children from forcing overflow */
.df-right > * { min-height: 0; }
.df-left  > * { min-height: 0; }

/* Responsive */
@media (max-width: 980px) {
  .dayframer { grid-template-columns: 1fr; }
}
</style>
