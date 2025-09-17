<template>
  <span class="badge">
    <span class="icon" aria-hidden="true">{{ icon }}</span>
    <span class="label">{{ label }}</span>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UiBadge",
  props: {
    icon: { type: String, default: "" },
    label: { type: String, required: true },
  },
});
</script>

<style scoped>
.badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background: #ffffff; border: 1px solid #eaeaea;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  font-size: 14px; color: #3a3a3a;
}
.icon { font-size: 14px; line-height: 1; }
.label { font-weight: 600; }
</style>
