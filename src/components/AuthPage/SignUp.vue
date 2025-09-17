<template>
  <div class="card-wrap">
    <div class="card-glow"></div>
    <div class="card">
      <!-- top row -->
      <div class="row between">
        <div class="row gap">
          <span class="dot dot-green"></span>
          <span class="chip-text">Focus mode</span>
        </div>
        <div class="muted">{{ todayLabel }}</div>
      </div>

      <!-- header -->
      <div class="auth-head">
        <h2 class="auth-title">Create your account</h2>
        
      </div>

      <!-- form -->
      <form class="form" @submit.prevent="onSubmit" novalidate>
        <label class="label" for="email">Email</label>
        <input
          id="email"
          class="input"
          type="email"
          v-model.trim="email"
          autocomplete="email"
          required
          :disabled="loading"
        />

        <label class="label" for="password">Password</label>
        <div class="pw-row">
          <input
            id="password"
            class="input pw"
            :type="showPw ? 'text' : 'password'"
            v-model="password"
            autocomplete="new-password"
            required
            :disabled="loading"
          />
          <button
            type="button"
            class="pw-toggle"
            @click="showPw = !showPw"
            :aria-pressed="showPw ? 'true' : 'false'"
            :disabled="loading"
          >
            {{ showPw ? 'Hide' : 'Show' }}
          </button>
        </div>

        <label class="label" for="confirm">Confirm password</label>
        <input
          id="confirm"
          class="input"
          :type="showPw ? 'text' : 'password'"
          v-model="confirm"
          autocomplete="new-password"
          required
          :disabled="loading"
        />

        <button class="btn btn-primary full" type="submit" :disabled="loading">
          <span v-if="loading">Creating…</span>
          <span v-else>Create account</span>
        </button>

        <p v-if="info" class="info">{{ info }}</p>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <div class="row between small">
          <router-link class="link-btn" :to="{ path: '/welcome', query: { mode: 'signin', redirect } }">
            Already have an account? Sign in
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

const props = defineProps<{ redirect?: string }>();

const router = useRouter();

const email = ref("");
const password = ref("");
const confirm = ref("");
const showPw = ref(false);
const loading = ref(false);
const errorMsg = ref("");
const info = ref("");

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })
);

async function onSubmit() {
  errorMsg.value = "";
  info.value = "";

  if (!email.value || !password.value || !confirm.value) {
    errorMsg.value = "Please fill out all fields.";
    return;
  }
  if (password.value.length < 6) {
    errorMsg.value = "Password must be at least 6 characters.";
    return;
  }
  if (password.value !== confirm.value) {
    errorMsg.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`,
      },
    });
    if (error) throw error;

    // If email confirmation is required (default), session will be null
    if (!data.session) {
      info.value = "Check your email to confirm your account.";
      return;
    }

    const dest = props.redirect || "/home";
    router.replace(dest).catch(() => router.replace("/"));
  } catch (e: any) {
    errorMsg.value = "We couldn’t create your account. Try a different email.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.card-wrap { --card-w: 360px; --card-h: 100%; }
.card-glow {
  position: absolute; inset: -12px -12px -28px -12px;
  filter: blur(28px); border-radius: 28px; background: rgba(0,0,0,0.06); z-index: 0;
}
.card-wrap { position: relative; width: var(--card-w); }
.card {
  position: relative; z-index: 1; width: var(--card-w);
  min-height: var(--card-h);
  display: flex; flex-direction: column; gap: 16px;
  border-radius: 24px; background: rgba(255,255,255,0.82);
  -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
  box-shadow: 0 40px 120px -20px rgba(0,0,0,0.25);
  padding: 20px; border: 1px solid rgba(255,255,255,0.6);
  background-color: rgba(var(--frame1-color), 0.3);
}
.row { display: flex; align-items: center; }
.row.gap { gap: 8px; }
.row.between { justify-content: space-between; }
.row.small { font-size: 12px; }

.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-green { background: #22c55e; }
.chip-text { font-size: 12px; font-weight: 600; color: #3a3a3a; }
.muted { font-size: 12px; color: #7a7a7a; }

.auth-head { margin-top: 8px; }
.auth-title { margin: 0 0 4px; font-size: 22px; font-weight: 800; color: #161616; }
.auth-sub { margin: 0; color: #666; font-size: 14px; }

.form { display: grid; gap: 10px; margin-top: 8px; }
.label { font-size: 12px; color: #444; font-weight: 600; }
.input {
  padding: 10px 12px; border-radius: 12px; border: 1px solid #e5e7eb;
  background: #fff; outline: none; font-size: 14px;
}
.input:focus { border-color: #cbd5e1; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }

.pw-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
.pw-toggle {
  border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 10px 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.link-btn {
  background: transparent; border: none; padding: 0;
  color: #2563eb; font-weight: 600; cursor: pointer; text-decoration: underline;
}

.btn {
  padding: 12px 16px; border-radius: 12px; font-weight: 700; border: 1px solid transparent;
  cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
}
.btn-primary {
  color: var(--secondary-text-color); background-color: var(--button-color);
  box-shadow: 0 10px 24px rgba(0,0,0,.18);
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 16px 36px rgba(0,0,0,.22);
  background-color: var(--button-hover-color); color: var(--primary-text-color);
}
.btn.full { width: 100%; }

.error { color: #d32f2f; font-size: 13px; margin-top: 4px; }
.info  { color: #047857; font-size: 13px; margin-top: 4px; }

@media (max-width: 420px) { .card-wrap, .card { width: 100%; } }
</style>
