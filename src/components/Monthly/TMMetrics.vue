<!-- MemberOutput.vue -->
<template>
  <aside class="atm-card">
    <div class="card-inner">
      <!-- TOP chip (absolute), black text, no outline -->
      <div class="chip" aria-hidden="true">
        <span class="chip-score">{{ gradeLabel }}</span>
      </div>

      <!-- Name + stacked counts (left) | avatar (right) -->
      <div class="header">
        <div class="identity">
          <h3 class="name" :title="displayName">{{ displayName }}</h3>

          <div class="count-col">
            <div class="count-line">
              <i class="fa-regular fa-circle-check ic ic-done" aria-hidden="true"></i>
              <span class="label">Done</span>
              <span class="value">{{ doneCount }}</span>
            </div>
            <div class="count-line">
              <i class="fa-regular fa-circle-xmark ic ic-undone" aria-hidden="true"></i>
              <span class="label">Undone</span>
              <span class="value">{{ undoneCount }}</span>
            </div>
            <div class="count-line">
              <i class="fa-regular fa-circle-right ic ic-total" aria-hidden="true"></i>
              <span class="label">Total</span>
              <span class="value">{{ totalCount }}</span>
            </div>
          </div>
        </div>

        <div class="avatar-wrap">
          <img class="avatar" src="/DefaultProfile.png" alt="User profile picture" />
        </div>
      </div>

      <!-- Packed meter (no gaps) -->
      <div class="rating-bar" role="img" :aria-label="`Completion ${completionPercentage}%`">
        <div
          v-for="(color, i) in ratingColors"
          :key="i"
          class="rating-step"
          :style="{ background: color, opacity: ratingLevel > i ? 1 : 0.17 }"
        />
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from "vue";

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  type: string | null;
  task_date: string;
  task_time: string | null;
  status: string | null;
  assigned_to: string | null; // display_name OR user_id
};

const props = defineProps<{
  displayName: string;
  userId: string;
  tasks: TaskRow[];
}>();

const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();
const isAssignedToMe = (t: TaskRow) =>
  norm(t.assigned_to) === norm(props.displayName) || norm(t.assigned_to) === norm(props.userId);

const doneCount = computed(
  () => props.tasks.filter(t => t.status === "done" && (isAssignedToMe(t) || t.user_id === props.userId)).length
);
const undoneCount = computed(
  () => props.tasks.filter(t => t.status !== "done" && (isAssignedToMe(t) || t.user_id === props.userId)).length
);
const totalCount = computed(() => doneCount.value + undoneCount.value);

const completionPercentage = computed(() => {
  const total = totalCount.value;
  return total === 0 ? 0 : Math.round((doneCount.value / total) * 100);
});

/** Exactly 10 buckets: 0–9, 10–19, ..., 90–100 */
function gradeFromPercent(p: number) {
  const idx = Math.min(9, Math.floor(p / 10)); // 0..9
  const table = [
    { label: "F9", color: "#ef4444" }, // 0–9
    { label: "D-", color: "#fdba74" }, // 10–19
    { label: "D",  color: "#fb923c" }, // 20–29
    { label: "D+", color: "#f97316" }, // 30–39
    { label: "C",  color: "#fbbf24" }, // 40–49
    { label: "C+", color: "#facc15" }, // 50–59
    { label: "B-", color: "#bef264" }, // 60–69
    { label: "B",  color: "#a3e635" }, // 70–79
    { label: "A",  color: "#22c55e" }, // 80–89
    { label: "A+", color: "#16a34a" }, // 90–100
  ];
  return table[idx];
}
const gradeLabel = computed(() => gradeFromPercent(completionPercentage.value).label);
const gradeColor  = computed(() => gradeFromPercent(completionPercentage.value).color); // kept if you want to use elsewhere

/** 10-step meter colors (red → green) */
const ratingColors = [
  "#e83b3b", "#ff5a3c", "#ff7a45", "#ffa149", "#ffc34d",
  "#d8d54b", "#a7d84a", "#79d949", "#49d95a", "#22c55e"
];

const ratingLevel = computed(() => Math.max(0, Math.min(Math.floor(completionPercentage.value / 10), 10)));
</script>

<style scoped>
.atm-card {
  width: 340px;
  height: 190px;
  border-radius: 20px;
  background: var(--background-secondary);
  box-shadow: 0 24px 60px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.06);
  overflow: hidden;
  position: relative;
  isolation: isolate;
}

/* slight sheen */
.atm-card::after {
  content: "";
  position: absolute; inset: 0;
  background:
    radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,.06) 0%, transparent 60%),
    linear-gradient(120deg, rgba(255,255,255,.04), rgba(255,255,255,0));
  pointer-events: none;
  mix-blend-mode: screen;
}

.card-inner {
  position: relative;
  height: 100%;
  padding: 16px 18px 14px;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 12px;
  color: #e5e7eb;
}

/* CHIP at the TOP (absolute). Black text. No outline. */
.chip {
  position: absolute;
  top: 16px; left: 18px;
  width: 56px; height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e1b968, #cfa24e 40%, #f7d58e 100%);
  display: grid; place-items: center;
  /* no outline/border; a soft drop shadow is fine */
  box-shadow: 0 6px 14px rgba(0,0,0,.18);
}
.chip-score {
  color: #000; /* black text as requested */
  font-weight: 900;
  font-size: 14px;
  line-height: 1;
}

/* Header layout: name/stats left, avatar right */
.header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}

/* Make room so the absolute chip doesn't overlap the text */
.identity { min-width: 0; padding-left: 0px; }
.name {
  margin: 0 0 6px 0;
  font-weight: 800;
  font-size: 18px;
  color: #f8fafc;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Stacked stats */
.count-col { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.count-line { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #e8eef6; }
.label { opacity: .9; }
.value { font-weight: 800; color: #f8fafc; }

/* Font Awesome icon colors */
.ic { font-size: 16px; line-height: 1; vertical-align: middle; }
.ic-done   { color: #22c55e; }
.ic-undone { color: #ef4444; }
.ic-total  { color: #3b82f6; }

/* Avatar */
.avatar-wrap { display: grid; place-items: center; }
.avatar {
  width: 68px; height: 68px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,.22);
}

/* Packed meter (no gaps) */
.rating-bar {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 0;
  padding: 0;
  height: 18px;
  border-radius: 10px;
  overflow: hidden;
}
.rating-step {
  height: 100%;
  width: 100%;
  border-radius: 0;
  transition: opacity .25s ease, transform .20s ease;
}
.rating-step:hover { transform: translateY(-1px); }

@media (max-width: 380px) {
  .atm-card { width: 100%; }
  .name { font-size: 16px; }
}
</style>
