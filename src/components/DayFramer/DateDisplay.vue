<template>
  <div class="date-display" v-if="parsed">
    <div class="line big">
      {{ parsed.dayOfMonth }}, {{ parsed.weekday }}
    </div>
    <div class="line">{{ parsed.month }}</div>
    <div class="line">{{ parsed.year }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{ date: string }>();

// Parse the ISO string "YYYY-MM-DD"
const parsed = computed(() => {
  if (!props.date) return null;
  const [y, m, d] = props.date.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);

  return {
    dayOfMonth: d,
    weekday: dt.toLocaleDateString(undefined, { weekday: "long" }),
    month: dt.toLocaleDateString(undefined, { month: "long" }),
    year: y,
  };
});
</script>

<style scoped>
.date-display {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* left aligned */
  gap: 1px;
}

.line {
  font-weight: 700;
  font-size: 16px;
  color: var(--text-color, #111);
  text-align: left;
}

.line.big {
  font-size: 30px;
}
</style>
