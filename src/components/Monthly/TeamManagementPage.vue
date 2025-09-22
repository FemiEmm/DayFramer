<template>
  <DashBoard />

  <section class="df-wrap">
    <div class="dayframer">
      <!-- TOP (formerly RIGHT) -->
      <main class="df-right">
        <section class="right-top no-scrollbar">
          <div class="metrics-list">
            <TMMetrics
              v-for="member in members"
              :key="member.user_id"
              :displayName="member.display_name"
              :userId="member.user_id"
              :tasks="tasks"
            />
          </div>
        </section>
      </main>

      <!-- BOTTOM (formerly LEFT) -->
      <aside class="df-left">
        <section class="left-top no-scrollbar">
          <h2 class="section-title">Team Tasks</h2>
        </section>
        <section class="left-bottom no-scrollbar">
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
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { supabase } from "@/lib/supabase";
import TMTasks from "./TMTasks.vue";
import TMMetrics from "./TMMetrics.vue";
import DashBoard from "@/components/DashBoard.vue";

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

const loading = ref(false);
const tasks = ref<TaskRow[]>([]);
const members = ref<Member[]>([]);
const teamId = ref<string | null>(null);

// current user
const currentUserId = ref<string>("");
const myName = ref<string>("Me");

// UI state
const tab = ref<"monthly" | "yearly">("monthly");
const monthYM = ref<string>(new Date().toISOString().slice(0, 7));
const yearNum = ref<number>(new Date().getFullYear());

const filterMemberId = ref<string | null>(null);
const filterType = ref<string | null>(null);

const typeOptions = [
  "Meeting", "Health", "Home", "Home & Household", "Health & Wellness",
  "Family", "Finance & Bills", "Learning and Growth", "Appointments", "Others"
];

const startISO = ref<string>("");
const endISO = ref<string>("");

function computeRange() {
  if (tab.value === "monthly") {
    const [y, m] = monthYM.value.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    startISO.value = start.toISOString().slice(0, 10);
    endISO.value = end.toISOString().slice(0, 10);
  } else {
    const y = yearNum.value;
    startISO.value = new Date(y, 0, 1).toISOString().slice(0, 10);
    endISO.value = new Date(y, 11, 31).toISOString().slice(0, 10);
  }
}

async function loadMembersAndTeam() {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess?.session?.user?.id;
  if (!uid) return;

  currentUserId.value = uid;

  const { data: prof } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", uid)
    .maybeSingle();
  myName.value = prof?.display_name || "Me";

  const { data: myMems } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", uid);

  if (!myMems?.length) {
    members.value = [{
      user_id: uid,
      display_name: myName.value,
      role: "member"
    }];
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

  const ids = rawMembers?.map(r => r.user_id) || [];
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

  const memberIds = members.value.map(m => m.user_id);
  const memberNames = members.value.map(m => m.display_name);

  if (filterMemberId.value) {
    const mm = members.value.find(x => x.user_id === filterMemberId.value);
    if (mm) {
      memberIds.splice(0, memberIds.length, mm.user_id);
      memberNames.splice(0, memberNames.length, mm.display_name);
    }
  }

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

  const byId = new Map<string, TaskRow>();
  for (const r of [...resAssigned, ...resCreated]) {
    if (filterType.value && r.type !== filterType.value) continue;
    byId.set(r.id, r);
  }

  tasks.value = Array.from(byId.values()).sort((a, b) => {
    if (a.task_date === b.task_date)
      return (a.task_time || "").localeCompare(b.task_time || "");
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

/* STACKED LAYOUT: right (top) then left (bottom) */
.dayframer {
  width: 100%;
  padding-left: 100px;
  padding-right: 100px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
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
  padding: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
}

/* BOTTOM (formerly left) */
.df-left {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  overflow: hidden;
  row-gap: 8px;
  padding: 0 50px 50px 50px;
}

.section-title {
  margin: 10px 0;
  font-weight: 800;
  font-size: 18px;
}

/* Make these sections scrollable… */
.df-left, .left-bottom { min-height: 0; }
.left-bottom { overflow: hidden; } /* TMTasks handles its own scroll */

/* TOP (formerly right) */
.df-right {
  display: grid;
  grid-template-rows: auto;
  height: 100%;
  min-height: 0;
  padding: 20px 20px 12px;
}

.right-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: auto;
  padding-top: 10px;
  gap: 16px;
}

/* Hide scrollbars where used */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE/old Edge */
  scrollbar-width: none;     /* Firefox */
}
.no-scrollbar::-webkit-scrollbar { display: none; }

.right-top.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.right-top.no-scrollbar::-webkit-scrollbar { display: none; }

.metrics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

/* Ensure children can scroll without forcing the page to scroll */
.df-right > * { min-height: 0; }
.df-left  > * { min-height: 0; }

/* Single-column everywhere; keep responsive niceties if needed */
@media (max-width: 980px) {
  .dayframer { padding-left: 20px; padding-right: 20px; }
  .df-left { padding: 0 20px 30px; }
}
</style>
