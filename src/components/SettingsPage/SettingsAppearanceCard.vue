<template>
  <section class="card">
    <h2 class="h2">Appearance & Accessibility</h2>
    <div class="toggle-row">
      <span class="tr-label">Dark theme</span>
      <button class="toggle" :class="{ on: isDark }" @click="toggleTheme"><span></span></button>
    </div>
    <p class="muted">Saved locally. Applies <code>dark-theme</code> on the document root.</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const isDark = ref(false);

onMounted(() => {
  const stored = localStorage.getItem("theme");
  isDark.value = stored ? stored === "dark" : document.documentElement.classList.contains("dark-theme");
  document.documentElement.classList.toggle("dark-theme", isDark.value);
});

function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark-theme", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
}
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }
.muted { color:#666;font-size:12px;margin-top:8px; }
code { background:#f7f7f7;border:1px solid #eee;padding:2px 6px;border-radius:8px; }

/* Toggle */
.toggle-row { display:flex;align-items:center;justify-content:space-between;padding:6px 0; }
.tr-label { font-weight:600; }
.toggle { width:46px;height:26px;border-radius:999px;background:#e5e7eb;border:none;position:relative;cursor:pointer; }
.toggle span { position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s ease;box-shadow:0 2px 6px rgba(0,0,0,.1); }
.toggle.on { background: var(--button-color); }
.toggle.on span { transform: translateX(20px); }
</style>
