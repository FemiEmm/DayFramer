<template>
  <div v-if="modelValue" class="overlay" @click.self="close">
    <div class="modal">
      <h3 class="title">Select multiple dates</h3>

      <div class="content">
        <!-- LEFT: calendar -->
        <div class="calendar">
          <input
            type="date"
            class="date-input"
            :value="currentPick"
            @change="addDate"
          />

          <p class="hint">
            Pick a date, repeat to add more.
          </p>
        </div>

        <!-- RIGHT: selected dates -->
        <div class="selected">
          <strong>Selected dates</strong>

          <ul v-if="dates.length" class="date-list">
            <li v-for="d in dates" :key="d">
              {{ formatDate(d) }}
              <button class="remove" @click="removeDate(d)">×</button>
            </li>
          </ul>

          <p v-else class="empty">
            No dates selected
          </p>
        </div>
      </div>

      <!-- ACTIONS (fixed bottom-left) -->
      <div class="actions">
        <button class="btn btn-secondary" @click="close">
          Cancel
        </button>
        <button class="btn btn-primary" @click="confirm">
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

const STORAGE_KEY = "planmyday_multi_dates";

export default defineComponent({
  name: "MultiDatePickerModal",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const dates = ref<string[]>([]);
    const currentPick = ref<string>("");

    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          const stored = localStorage.getItem(STORAGE_KEY);
          dates.value = stored ? JSON.parse(stored) : [];
        }
      }
    );

    const addDate = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      if (!value) return;
      if (!dates.value.includes(value)) {
        dates.value.push(value);
        dates.value.sort();
      }
      currentPick.value = "";
    };

    const removeDate = (d: string) => {
      dates.value = dates.value.filter(x => x !== d);
    };

    const confirm = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dates.value));
      emit("update:modelValue", false);
    };

    const close = () => {
      emit("update:modelValue", false);
    };

    const formatDate = (iso: string) => {
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    };

    return {
      dates,
      currentPick,
      addDate,
      removeDate,
      confirm,
      close,
      formatDate,
    };
  },
});
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: grid;
  place-items: center;
  z-index: 2000;
}

.modal {
  background: #fff;
  width: min(90vw, 750px);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

.title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
}

.calendar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.hint {
  font-size: 12px;
  color: #666;
}

.selected {
  background: #f9f9f9;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
}

.date-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.date-list li {
  background: #fff;
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.remove {
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: #999;
}

.remove:hover {
  color: #000;
}

.empty {
  font-size: 12px;
  color: #777;
  margin-top: 8px;
}

.actions {
  position: sticky;
  bottom: 0;
  left: 0;
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  background: #fff;
  justify-content: flex-start;
}

.btn {
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background: #111;
  color: #fff;
}

.btn-secondary {
  background: #fff;
  border-color: #ddd;
}
</style>
