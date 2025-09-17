<template>
  <div class="sparkline">
    <svg viewBox="0 0 100 28" class="svg">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#22c55e" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
        </linearGradient>
      </defs>

      <polyline
        :points="polyPoints"
        fill="url(#sparkGrad)"
        stroke="#22c55e"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <!-- subtle right fade -->
    <div class="fade"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "Sparkline",
  props: { values: { type: Array as () => number[], required: true } },
  setup(props) {
    const polyPoints = computed(() => {
      const vals = props.values || [];
      if (!vals.length) return "";
      const max = Math.max(...vals, 1);
      const inner = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * 100;
        const y = 28 - (v / max) * 26 - 1;
        return `${x},${y}`;
      });
      return `0,28 ${inner.join(" ")} 100,28`;
    });
    return { polyPoints };
  },
});
</script>

<style scoped>
.sparkline { position: relative; height: 110px; }
.svg { width: 100%; height: 100%; display: block; }
.fade {
  position: absolute; right: 0; top: 0; bottom: 0; width: 33%;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(1px); -webkit-backdrop-filter: blur(1px);
  pointer-events: none; border-top-right-radius: 8px; border-bottom-right-radius: 8px;
}
</style>
