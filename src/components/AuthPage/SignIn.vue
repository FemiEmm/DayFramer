<!-- src/components/AuthPage/SignInCard.vue -->
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
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-sub">Sign in to continue</p>
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
          :aria-invalid="!!errorMsg"
          aria-describedby="signin-error signin-info"
        />

        <label class="label" for="password">Password</label>
        <div class="pw-row">
          <input
            id="password"
            class="input pw"
            :type="showPw ? 'text' : 'password'"
            v-model="password"
            autocomplete="current-password"
            required
            :disabled="loading"
            :aria-invalid="!!errorMsg"
            aria-describedby="signin-error signin-info"
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

        <div class="row between small">
          <button
            type="button"
            class="link-btn"
            @click="sendReset"
            :disabled="loading || !email"
            title="Send password reset to the email above"
          >
            Forgot password?
          </button>
          <router-link class="link-btn" :to="{ path: '/welcome', query: { mode: 'signup', redirect } }">
            Create account
          </router-link>
        </div>

        <button class="btn btn-primary full" type="submit" :disabled="loading || !canSubmit">
          <span v-if="loading">Signing in…</span>
          <span v-else>Sign in</span>
        </button>

        <p id="signin-info" v-if="info" class="info" aria-live="polite">{{ info }}</p>
        <p id="signin-error" v-if="errorMsg" class="error" aria-live="assertive">{{ errorMsg }}</p>
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
const showPw = ref(false);
const loading = ref(false);
const errorMsg = ref("");
const info = ref("");

// basic client-side email check
const validEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value || "")
);
const canSubmit = computed(() => !!email.value && !!password.value && validEmail.value);

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })
);

function normalizeAuthError(e: any): string {
  const msg = (e?.message || "").toLowerCase();
  const status = e?.status || e?.statusCode;

  if (status === 429 || msg.includes("rate") || msg.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
    return "Network error. Check your connection and try again.";
  }
  if (msg.includes("invalid login") || msg.includes("invalid credentials") || status === 400) {
    return "Email or password is incorrect.";
  }
  return "Sign-in failed. Please try again.";
}

/** Ensure the user exists in profiles before routing. */
async function ensureProfileExists(uid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", uid)
    .maybeSingle();

  if (error) {
    // If your RLS blocks this, you'll want to allow SELECT id for authenticated users
    console.error("profiles check failed:", error);
    return false;
  }
  return !!data;
}

async function onSubmit() {
  errorMsg.value = "";
  info.value = "";

  if (!canSubmit.value) {
    errorMsg.value = !validEmail.value
      ? "Enter a valid email address."
      : "Please enter your email and password.";
    return;
  }

  loading.value = true;
  try {
    // 1) Authenticate
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;

    const uid = data.user?.id;
    if (!uid) {
      throw new Error("No user returned from auth.");
    }

    // 2) Check profiles table; if not found, sign out and show error
    const exists = await ensureProfileExists(uid);
    if (!exists) {
      await supabase.auth.signOut(); // drop the session immediately
      errorMsg.value = "Enter a valid email.";
      return;
    }

    // 3) OK to route
    const dest = props.redirect || "/home";
    router.replace(dest).catch(() => router.replace("/"));
  } catch (e: any) {
    errorMsg.value = normalizeAuthError(e);
  } finally {
    loading.value = false;
  }
}

async function sendReset() {
  errorMsg.value = "";
  info.value = "";

  if (!validEmail.value) {
    errorMsg.value = "Enter a valid email address first.";
    return;
  }

  loading.value = true;
  try {
    await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`,
    });
    info.value = "If an account exists for that email, a reset link has been sent.";
  } catch (e: any) {
    errorMsg.value = "Could not send reset link. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.card-wrap { --card-w: 360px; --card-h: 100%; }
.card-glow { position: absolute; inset: -12px -12px -28px -12px; filter: blur(28px); border-radius: 28px; background: rgba(0,0,0,0.06); z-index: 0; }
.card-wrap { position: relative; width: var(--card-w); }
.card {
  position: relative; z-index: 1; width: var(--card-w); min-height: var(--card-h);
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
.input { padding: 10px 12px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; outline: none; font-size: 14px; }
.input:focus { border-color: #cbd5e1; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }

.pw-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
.pw-toggle { border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; padding: 10px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
.link-btn { background: transparent; border: none; padding: 0; color: #2563eb; font-weight: 600; cursor: pointer; text-decoration: underline; }

.btn { padding: 12px 16px; border-radius: 12px; font-weight: 700; border: 1px solid transparent; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
.btn-primary { color: var(--secondary-text-color); background-color: var(--button-color); box-shadow: 0 10px 24px rgba(0,0,0,.18); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 16px 36px rgba(0,0,0,.22); background-color: var(--button-hover-color); color: var(--primary-text-color); }
.btn.full { width: 100%; }

.error { color: #d32f2f; font-size: 13px; margin-top: 4px; }
.info  { color: #047857; font-size: 13px; margin-top: 4px; }

@media (max-width: 420px) { .card-wrap, .card { width: 100%; } }
</style>
