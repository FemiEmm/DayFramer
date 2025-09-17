<template>
  <section class="card">
    <h2 class="h2">Data & Privacy</h2>

    <div class="stack">
      <div class="row">
        <button class="btn btn-secondary" @click="exportTasksCsv">Export tasks (CSV)</button>
        <a v-if="csvHref" :href="csvHref" download="dayframe-tasks.csv" class="link">Download</a>
      </div>

      <div class="row">
        <input type="file" accept=".csv" @change="importTasksCsv" />
      </div>

      <div class="field">
        <label class="label">Data retention</label>
        <select class="input" v-model="retention" @change="persistRetention">
          <option value="manual">Manual</option>
          <option value="weekly">Delete completed weekly</option>
          <option value="monthly">Delete completed monthly</option>
          <option value="yearly">Delete completed yearly</option>
        </select>
      </div>
    </div>
    <p class="muted">Tasks data is currently stored in your browser (localStorage).</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const TASKS_KEY = "dayframer.tasks.v1";
const RETAIN_KEY = "settings.retention";

const csvHref = ref<string | null>(null);
const retention = ref<"manual" | "weekly" | "monthly" | "yearly">("manual");

onMounted(() => {
  const r = localStorage.getItem(RETAIN_KEY);
  if (r === "weekly" || r === "monthly" || r === "yearly" || r === "manual") retention.value = r;
});

function exportTasksCsv() {
  const raw = localStorage.getItem(TASKS_KEY) || '{"byDate":{}}';
  const store = JSON.parse(raw);
  const rows: string[] = ["date,time,title,note,type,priority,assignedTo,status"];
  for (const [date, arr] of Object.entries<any[]>(store.byDate || {})) {
    for (const t of arr) {
      const line = [
        date,
        t.time || "",
        (t.title || "").replace(/"/g, '""'),
        (t.note || "").replace(/"/g, '""'),
        t.type || "",
        t.priority ?? "",
        t.assignedTo || "",
        t.status || "",
      ].map((v) => `"${String(v)}"`).join(",");
      rows.push(line);
    }
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  csvHref.value = URL.createObjectURL(blob);
}

function importTasksCsv(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      lines.shift(); // header
      const store = JSON.parse(localStorage.getItem(TASKS_KEY) || '{"byDate":{}}');
      if (!store.byDate) store.byDate = {};
      for (const line of lines) {
        const cols = parseCsv(line);
        const [date, time, title, note, type, priority, assignedTo, status] = cols;
        store.byDate[date] = store.byDate[date] || [];
        store.byDate[date].push({
          date, time, title, note, type, priority: Number(priority) || 3, assignedTo, status,
        });
      }
      localStorage.setItem(TASKS_KEY, JSON.stringify(store));
      alert("Imported tasks.");
    } catch {
      alert("Import failed. Check your CSV.");
    }
  };
  reader.readAsText(file);
}

function parseCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function persistRetention() {
  localStorage.setItem(RETAIN_KEY, retention.value);
}
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }
.stack { display:grid;gap:8px; }
.field { display:grid;gap:6px; }
.label { font-size:12px;color:#444;font-weight:700; }
.input { width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font:inherit; }
.row { display:flex;align-items:center;gap:8px; }
.link { color: var(--button-color); text-decoration: underline; }
.muted { color:#666;font-size:12px;margin-top:8px; }
.btn { padding:10px 14px;border-radius:12px;border:1px solid transparent;background:var(--button-color);color:var(--secondary-text-color);font-weight:700;cursor:pointer; }
.btn.btn-secondary{background:#fff;color:#111;border:1px solid #e5e7eb;}
</style>
