<template>
  <div class="wrap">
    <div class="panel">
      <h2>Forgot your password?</h2>
      <p class="sub">Enter your email and we’ll send you a reset link.</p>

      <form @submit.prevent="sendReset">
        <label class="label" for="email">Email</label>
        <input id="email" class="input" type="email" v-model.trim="email" required autocomplete="email" />
        <button class="btn" type="submit" :disabled="loading">
          <span v-if="loading">Sending…</span>
          <span v-else>Send reset link</span>
        </button>
      </form>

      <p v-if="info" class="ok">{{ info }}</p>
      <p v-if="err" class="err">{{ err }}</p>

      <router-link class="link" :to="{ path: '/', query: { mode: 'signin' } }">Back to sign in</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/lib/supabase";

const email = ref("");
const loading = ref(false);
const info = ref("");
const err = ref("");

async function sendReset() {
  info.value = "";
  err.value = "";
  if (!email.value) {
    err.value = "Please enter your email.";
    return;
  }
  loading.value = true;
  try {
    await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`,
    });
    info.value = "Reset link sent. Check your email.";
  } catch {
    err.value = "Could not send reset link. Try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.wrap { max-width: 520px; margin: 64px auto; padding: 0 16px; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 20px; box-shadow: 0 12px 32px rgba(0,0,0,.08); }
.sub { color: #6b7280; font-size: 14px; margin: 6px 0 10px; }
.label { font-size: 12px; color: #444; font-weight: 600; display: block; margin-top: 10px; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; }
.btn { margin-top: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid transparent; background: var(--button-color); color: var(--secondary-text-color); cursor: pointer; }
.link { display: inline-block; margin-top: 10px; text-decoration: underline; color: #2563eb; }
.err { color: #d32f2f; font-size: 13px; margin-top: 6px; }
.ok  { color: #047857; font-size: 13px; margin-top: 6px; }
</style>
