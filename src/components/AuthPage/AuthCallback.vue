<template>
  <div class="wrap">
    <!-- Password reset flow -->
    <form v-if="isReset" class="panel" @submit.prevent="saveNewPassword">
      <h2>Set a new password</h2>
      <input class="input" type="password" v-model="newPassword" placeholder="New password" required />
      <input class="input" type="password" v-model="confirm" placeholder="Confirm password" required />
      <button class="btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save password' }}</button>
      <p v-if="msg" class="ok">{{ msg }}</p>
      <p v-if="err" class="err">{{ err }}</p>
    </form>

    <!-- Email confirmation / magic link -> profile completion or redirect -->
    <div v-else class="panel">
      <h2>{{ status }}</h2>
      <ProfileForm v-if="needsProfile" @saved="handleProfileSaved" />
      <p v-if="err" class="err">{{ err }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import ProfileForm from "./ProfileForm.vue";

const router = useRouter();
const route = useRoute();

const isReset = ref(false);
const needsProfile = ref(false);
const status = ref("Finalizing sign-in…");
const saving = ref(false);
const err = ref("");
const msg = ref("");

const newPassword = ref("");
const confirm = ref("");

// sanitize redirect: only allow internal paths
const rawRedirect = (route.query.redirect as string) || "/home";
const redirect = rawRedirect.startsWith("/") ? rawRedirect : "/home";

onMounted(async () => {
  const qs = window.location.search || "";
  const hash = window.location.hash || "";

  try {
    // 1) PKCE / OAuth / magic link with ?code=...
    if (qs.includes("code=")) {
      await supabase.auth.exchangeCodeForSession(window.location.href);
    }
  } catch (e) {
    err.value = "We couldn’t complete sign-in. Please try again.";
    await router.replace({ path: "/", query: { mode: "signin" } });
    return;
  }

  // 2) Password recovery flow (hash tokens + type=recovery)
  if (hash.includes("type=recovery")) {
    isReset.value = true;
    status.value = "Set a new password";
    return;
  }

  // 3) We should now have a session
  const { data: sess } = await supabase.auth.getSession();
  const user = sess.session?.user;
  if (!user) {
    await router.replace({ path: "/", query: { mode: "signin" } });
    return;
  }

  // 4) Check profile; if missing, show the form
  try {
    const { data: row, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && row) {
      status.value = "Welcome back. Taking you in…";
      setTimeout(() => router.replace(redirect), 400);
    } else {
      needsProfile.value = true;
      status.value = "Tell us a bit about you";
    }
  } catch {
    // If the check fails, just show the form
    needsProfile.value = true;
    status.value = "Tell us a bit about you";
  }
});

async function saveNewPassword() {
  err.value = "";
  msg.value = "";
  if (!newPassword.value || !confirm.value) {
    err.value = "Please fill both password fields.";
    return;
  }
  if (newPassword.value !== confirm.value) {
    err.value = "Passwords do not match.";
    return;
  }

  saving.value = true;
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) throw error;
    msg.value = "Password updated. Redirecting to sign in…";
    setTimeout(() => router.replace({ path: "/", query: { mode: "signin" } }), 900);
  } catch {
    err.value = "Could not update password. Try again.";
  } finally {
    saving.value = false;
  }
}

function handleProfileSaved(next: "onboarding" | "home") {
  router.replace(next === "onboarding" ? "/onboarding" : "/home");
}
</script>

<style scoped>
.wrap { max-width: 960px; margin: 4px auto; padding: 20px 16px; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 20px; box-shadow: 0 12px 32px rgba(0,0,0,.08); text-align: center; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 10px; }
.btn { margin-top: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid transparent; background: var(--button-color); color: var(--secondary-text-color); cursor: pointer; }
.err { color: #d32f2f; font-size: 13px; margin-top: 6px; }
.ok  { color: #047857; font-size: 13px; margin-top: 6px; }
</style>
