<!-- src/components/TeamPage/TMMetrics.vue -->
<template>
  <aside class="metrics-card">
    <h3 class="m-title">My Progress</h3>
    <div class="m-line">
      <span class="label">User</span>
      <span class="value">{{ displayName }}</span>
    </div>
    <div class="m-line">
      <span class="label">Tasks done</span>
      <span class="value strong">{{ doneCount }}</span>
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
  assigned_to: string | null; // display name snapshot
};

const props = defineProps<{
  displayName: string;
  userId: string;
  tasks: TaskRow[];
}>();

/**
 * Count tasks "done" for the current user in the provided period:
 * - Prefer tasks explicitly assigned to them via display name
 * - Also count tasks they created (user_id) when not assigned by name
 */
const doneCount = computed(() => {
  let count = 0;
  for (const t of props.tasks) {
    if (t.status !== "done") continue;
    const assignedToMe = t.assigned_to && t.assigned_to === props.displayName;
    const createdByMe  = t.user_id === props.userId;
    if (assignedToMe || createdByMe) count++;
  }
  return count;
});
</script>

<style scoped>
.metrics-card { background:#fafafa; border:1px solid #eee; border-radius:12px; padding:12px; }
.m-title { margin:0 0 8px; font-weight:800; font-size:16px; }
.m-line { display:flex; justify-content:space-between; align-items:center; padding:6px 0; }
.label { font-size:12px; color:#666; }
.value { font-weight:700; }
.value.strong { font-size:20px; }
</style>
