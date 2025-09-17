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

    <!-- Email confirmation -> profile completion -->
    <div v-else>
      <div v-if="needsProfile" class="panel">
        <h2>Finish setting up your account</h2>
        <ProfileForm @saved="handleProfileSaved" />
        <!-- no error shown for the check; we fall back to the form -->
      </div>

      <div v-else class="panel">
        <h2>{{ status }}</h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/lib/supabase"; // or "@/lib/supabaseClient"
import ProfileForm from "./ProfileForm.vue";

const router = useRouter();
const route = useRoute();

const isReset = ref(false);
const needsProfile = ref(false);
const status = ref("Confirming your email…");
const saving = ref(false);
const err = ref("");
const msg = ref("");

const newPassword = ref("");
const confirm = ref("");

const redirect = (route.query.redirect as string) || "/home";

onMounted(async () => {
  const hash = window.location.hash || "";

  // Password reset?
  if (hash.includes("type=recovery")) {
    isReset.value = true;
    status.value = "Set a new password";
    return;
  }

  // Confirmed sign-up / magic link
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    status.value = "No active session. Redirecting to sign in…";
    setTimeout(() => router.replace({ path: "/", query: { mode: "signin" } }), 900);
    return;
  }

  // Try to see if a profile exists — but if anything goes wrong, just show the form.
  let profileExists = false;
  try {
    const { data: row, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && row) profileExists = true;
  } catch (_) {
    // ignore and treat as no profile
  }

  if (profileExists) {
    status.value = "Welcome back. Taking you in…";
    setTimeout(() => router.replace(redirect), 600);
  } else {
    needsProfile.value = true;        // <= show the form right now
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
.wrap { max-width: 560px; margin: 64px auto; padding: 0 16px; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 16px; padding: 20px; box-shadow: 0 12px 32px rgba(0,0,0,.08); text-align: center; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 10px; }
.btn { margin-top: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid transparent; background: var(--button-color); color: var(--secondary-text-color); cursor: pointer; }
.err { color: #d32f2f; font-size: 13px; margin-top: 6px; }
.ok  { color: #047857; font-size: 13px; margin-top: 6px; }
</style>
