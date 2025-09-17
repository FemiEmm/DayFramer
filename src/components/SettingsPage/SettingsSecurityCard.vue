<template>
  <section class="card">
    <h2 class="h2">Security</h2>
    <div class="field two">
      <div>
        <label class="label">New password</label>
        <input class="input" type="password" v-model.trim="newPassword" placeholder="••••••••" />
      </div>
      <div>
        <label class="label">Confirm</label>
        <input class="input" type="password" v-model.trim="newPassword2" placeholder="••••••••" />
      </div>
    </div>
    <div class="row">
      <button class="btn" :disabled="busy" @click="changePassword">Change password</button>
      <span class="muted">{{ msg }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const newPassword = ref("");
const newPassword2 = ref("");
const busy = ref(false);
const msg = ref("");

async function changePassword() {
  if (!newPassword.value || newPassword.value !== newPassword2.value) {
    msg.value = "Passwords do not match.";
    return;
  }
  busy.value = true; msg.value = "";
  const { error } = await supabase.auth.updateUser({ password: newPassword.value });
  msg.value = error ? `Error: ${error.message}` : "Password updated.";
  busy.value = false;
  newPassword.value = "";
  newPassword2.value = "";
}
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }
.field { display:grid;gap:6px; }
.field.two { grid-template-columns:1fr 1fr;gap:8px; }
.label { font-size:12px;color:#444;font-weight:700; }
.input { width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font:inherit; }
.row { display:flex;align-items:center;gap:8px;margin-top:8px; }
.muted { color:#666;font-size:12px; }
.btn { padding:10px 14px;border-radius:12px;border:1px solid transparent;background:var(--button-color);color:var(--secondary-text-color);font-weight:700;cursor:pointer; }
.btn:disabled{opacity:.7;cursor:not-allowed;}
</style>
