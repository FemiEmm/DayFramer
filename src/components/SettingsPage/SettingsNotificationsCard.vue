<template>
  <section class="card">
    <h2 class="h2">Notifications & Reminders</h2>

    <div class="toggle-row">
      <span class="tr-label">Email reminders</span>
      <button class="toggle" :class="{ on: notifEmail }" @click="toggle('email')"><span></span></button>
    </div>

    <div class="toggle-row">
      <span class="tr-label">Push/browser notifications</span>
      <button class="toggle" :class="{ on: notifPush }" @click="toggle('push')"><span></span></button>
    </div>

    <div class="field two">
      <div>
        <label class="label">Quiet hours: start</label>
        <input class="input" type="time" v-model="quietStart" @change="persist()" />
      </div>
      <div>
        <label class="label">Quiet hours: end</label>
        <input class="input" type="time" v-model="quietEnd" @change="persist()" />
      </div>
    </div>

    <div class="field">
      <label class="label">Reminder default (minutes before)</label>
      <input class="input" type="number" min="0" step="5" v-model.number="reminderMins" @change="persist()" />
    </div>

    <p class="muted">Stored locally for now (MVP). You can wire this to Supabase later.</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const KEY = "settings.notifications";

const notifEmail = ref(false);
const notifPush = ref(false);
const quietStart = ref("21:00");
const quietEnd = ref("07:00");
const reminderMins = ref(10);

onMounted(() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      notifEmail.value = !!s.email;
      notifPush.value = !!s.push;
      quietStart.value = s.quietStart || "21:00";
      quietEnd.value = s.quietEnd || "07:00";
      reminderMins.value = typeof s.reminderMins === "number" ? s.reminderMins : 10;
    }
  } catch {}
});

function persist() {
  const s = {
    email: notifEmail.value,
    push: notifPush.value,
    quietStart: quietStart.value,
    quietEnd: quietEnd.value,
    reminderMins: reminderMins.value,
  };
  localStorage.setItem(KEY, JSON.stringify(s));
}

function toggle(which: "email" | "push") {
  if (which === "email") notifEmail.value = !notifEmail.value;
  if (which === "push") notifPush.value = !notifPush.value;
  persist();
}
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }

.field { display:grid;gap:6px; }
.field.two { grid-template-columns:1fr 1fr;gap:8px; }
.label { font-size:12px;color:#444;font-weight:700; }
.input { width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font:inherit; }
.muted { color:#666;font-size:12px;margin-top:8px; }

/* Toggle */
.toggle-row { display:flex;align-items:center;justify-content:space-between;padding:6px 0; }
.tr-label { font-weight:600; }
.toggle { width:46px;height:26px;border-radius:999px;background:#e5e7eb;border:none;position:relative;cursor:pointer; }
.toggle span { position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s ease;box-shadow:0 2px 6px rgba(0,0,0,.1); }
.toggle.on { background: var(--button-color); }
.toggle.on span { transform: translateX(20px); }
</style>
