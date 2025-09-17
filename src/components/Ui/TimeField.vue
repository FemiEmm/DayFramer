<template>
  <div class="timefield" ref="wrap">
    <!-- Trigger / display -->
    <button
      type="button"
      class="timefield-display"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      @click="openPopover"
    >
      <span class="timefield-value" :class="{ has: !!modelValue }">
        {{ modelValue || '--:--' }}
      </span>
      <span class="timefield-icon" aria-hidden="true">🕑</span>
    </button>

    <!-- Popover -->
    <div v-if="open" class="time-popover" role="dialog" @keydown.stop="onKey">
      <div class="time-grid">
        <label class="time-col">
          <span class="tiny-label">Hour</span>
          <select ref="hourEl" v-model="hour" class="input">
            <option v-for="h in 24" :key="h" :value="pad2(h-1)">
              {{ pad2(h-1) }}
            </option>
          </select>
        </label>

        <label class="time-col">
          <span class="tiny-label">Minute</span>
          <select v-model="minute" class="input">
            <option v-for="m in minuteOptions" :key="m" :value="pad2(m)">
              {{ pad2(m) }}
            </option>
          </select>
        </label>
      </div>

      <div class="time-actions">
        <button type="button" class="btn btn-secondary btn-sm" @click="onCancel">
          Cancel
        </button>
        <button type="button" class="btn btn-primary btn-sm" @click="onOk">
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
} from "vue";

export default defineComponent({
  name: "TimeField",
  props: {
    modelValue: { type: String, default: "" }, // "HH:mm"
    step: { type: Number, default: 5 }, // minute step
    autoDefaultNow: { type: Boolean, default: true }, // fill local time if empty
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const open = ref(false);
    const wrap = ref<HTMLElement | null>(null);
    const hourEl = ref<HTMLSelectElement | null>(null);

    const hour = ref("00");
    const minute = ref("00");

    const pad2 = (n: number | string) => String(n).padStart(2, "0");

    const minuteOptions = computed(() => {
      const arr: number[] = [];
      for (let m = 0; m < 60; m += Math.max(1, props.step)) arr.push(m);
      return arr;
    });

    const setFromString = (val: string) => {
      const [h, m] = (val || "00:00").split(":");
      hour.value = pad2(h || "00");
      minute.value = pad2(m || "00");
    };

    const toValue = () => `${pad2(hour.value)}:${pad2(minute.value)}`;

    const roundToStep = (date: Date) => {
      const step = Math.max(1, props.step);
      const h = date.getHours();
      const m = date.getMinutes();
      const rounded = Math.round(m / step) * step;
      const finalH = rounded === 60 ? (h + 1) % 24 : h;
      const finalM = rounded === 60 ? 0 : rounded;
      return { h: pad2(finalH), m: pad2(finalM) };
    };

    const applyDefaultNowIfNeeded = () => {
      if (props.autoDefaultNow && !props.modelValue) {
        const { h, m } = roundToStep(new Date());
        const def = `${h}:${m}`;
        setFromString(def);
        emit("update:modelValue", def);
      } else {
        setFromString(props.modelValue || "00:00");
      }
    };

    onMounted(() => {
      applyDefaultNowIfNeeded();
      document.addEventListener("mousedown", onDocDown);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("mousedown", onDocDown);
    });

    watch(
      () => props.modelValue,
      (v) => {
        if (!open.value) setFromString(v || "00:00");
      }
    );

    const openPopover = () => {
      if (!props.modelValue) applyDefaultNowIfNeeded();
      else setFromString(props.modelValue);
      open.value = true;
      requestAnimationFrame(() => hourEl.value?.focus());
    };

    const closePopover = () => {
      open.value = false;
    };

    const onOk = () => {
      emit("update:modelValue", toValue());
      closePopover();
    };

    const onCancel = () => {
      setFromString(props.modelValue || "00:00");
      closePopover();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onOk();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    const onDocDown = (e: MouseEvent) => {
      if (!open.value) return;
      if (wrap.value && !wrap.value.contains(e.target as Node)) {
        onCancel();
      }
    };

    return {
      open,
      wrap,
      hourEl,
      hour,
      minute,
      minuteOptions,
      pad2,
      openPopover,
      onOk,
      onCancel,
      onKey,
    };
  },
});
</script>

<style scoped>
.timefield {
  position: relative;
}
.timefield-display {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.timefield-display:hover {
  border-color: #d6dae0;
}
.timefield-value {
  text-align: left;
  color: #9aa1a9;
}
.timefield-value.has {
  color: #111;
}
.timefield-icon {
  opacity: 0.75;
  font-size: 14px;
}
.time-popover {
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  left: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  width: 240px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.time-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: end;
}
.time-col {
  display: grid;
  gap: 4px;
}
.tiny-label {
  font-size: 11px;
  color: #666;
}
.input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  width: 100%;
  font: inherit;
}
.time-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 12px;
}
.btn-primary {
  background: #111;
  color: #fff;
  border-color: #111;
}
.btn-secondary {
  background: #fff;
  color: #111;
}
.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}
</style>
