<template>
  <section class="card">
    <h2 class="h2">Profile</h2>

    <div class="profile">
      <!-- Avatar -->
      <div class="pf-left">
        <div class="avatar" :style="avatarStyle">
          <i v-if="!avatarUrl" class="fa fa-user"></i>
        </div>
        <div class="row">
          <label class="btn btn-secondary">
            <input type="file" accept="image/*" hidden @change="onAvatarPick" />
            Upload
          </label>
          <button class="btn btn-plain" :disabled="busyAvatar || !avatarUrl" @click="removeAvatar">
            Remove
          </button>
        </div>
        <p class="hint">PNG/JPG, square works best</p>
        <p v-if="avatarMsg" class="muted">{{ avatarMsg }}</p>
      </div>

      <!-- Fields -->
      <div class="pf-right">
        <div class="field">
          <label class="label">Display name</label>
          <div class="row">
            <input class="input" v-model.trim="displayName" placeholder="What should we call you?" />
            <button class="btn" :disabled="busyProfile" @click="saveDisplayName">Save</button>
          </div>
          <p v-if="profileMsg" class="muted">{{ profileMsg }}</p>
        </div>

        <div class="field two">
          <div>
            <label class="label">First name</label>
            <input class="input" :value="firstName" disabled />
          </div>
          <div>
            <label class="label">Last name</label>
            <input class="input" :value="lastName" disabled />
          </div>
        </div>

        <div class="field">
          <label class="label">Email</label>
          <div class="row">
            <input class="input" :value="email" disabled />
            <button class="btn btn-secondary" :disabled="busyEmail" @click="startEmailChange">Change</button>
          </div>
          <p v-if="emailMsg" class="muted">{{ emailMsg }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { supabase } from "@/lib/supabase";

const userId = ref<string | null>(null);
const email = ref("");
const firstName = ref("");
const lastName = ref("");
const displayName = ref("");

const avatarUrl = ref<string | null>(null);
const busyAvatar = ref(false);
const avatarMsg = ref("");

const busyProfile = ref(false);
const profileMsg = ref("");

const busyEmail = ref(false);
const emailMsg = ref("");

onMounted(loadUserAndProfile);

const avatarStyle = computed(() => ({
  backgroundImage: avatarUrl.value ? `url(${avatarUrl.value})` : "none",
  backgroundSize: "cover",
  backgroundPosition: "center",
}));

async function loadUserAndProfile() {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  userId.value = user?.id ?? null;
  email.value = user?.email ?? "";

  if (userId.value) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("first_name,last_name,display_name,avatar_url")
      .eq("id", userId.value)
      .maybeSingle();

    firstName.value = prof?.first_name ?? "";
    lastName.value = prof?.last_name ?? "";
    displayName.value = prof?.display_name ?? "";
    avatarUrl.value = prof?.avatar_url ?? null;
  }
}

async function saveDisplayName() {
  if (!userId.value) return;
  busyProfile.value = true;
  profileMsg.value = "";
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName.value, updated_at: new Date().toISOString() })
    .eq("id", userId.value);
  profileMsg.value = error ? `Error: ${error.message}` : "Saved!";
  busyProfile.value = false;
}

async function startEmailChange() {
  busyEmail.value = true;
  emailMsg.value = "";
  const newEmail = window.prompt("Enter new email", email.value) || "";
  if (!newEmail || newEmail === email.value) { busyEmail.value = false; return; }
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  emailMsg.value = error ? `Error: ${error.message}` : "Check both inboxes to confirm email change.";
  busyEmail.value = false;
}

async function onAvatarPick(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files?.[0] || !userId.value) return;
  const file = files[0];
  busyAvatar.value = true;
  avatarMsg.value = "";

  try {
    const path = `${userId.value}.png`;
    await supabase.storage.from("avatars").remove([path]).catch(() => {});
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type || "image/png",
    });
    if (upErr) throw upErr;

    const { data: pub } = await supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl.value = pub?.publicUrl ?? null;

    await supabase.from("profiles").update({ avatar_url: avatarUrl.value }).eq("id", userId.value);
    avatarMsg.value = "Avatar updated.";
  } catch (e: any) {
    avatarMsg.value = e?.message || "Upload failed. Ensure a public 'avatars' bucket exists.";
  } finally {
    busyAvatar.value = false;
  }
}

async function removeAvatar() {
  if (!userId.value || !avatarUrl.value) return;
  busyAvatar.value = true;
  avatarMsg.value = "";
  try {
    const path = `${userId.value}.png`;
    await supabase.storage.from("avatars").remove([path]).catch(() => {});
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId.value);
    avatarUrl.value = null;
    avatarMsg.value = "Avatar removed.";
  } catch (e: any) {
    avatarMsg.value = e?.message || "Failed to remove avatar.";
  } finally {
    busyAvatar.value = false;
  }
}
</script>

<style scoped>
.card { background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.06);padding:16px; }
.h2 { margin:0 0 10px;font-weight:800;font-size:18px; }

.profile { display:grid;grid-template-columns:220px 1fr;gap:16px; }
.pf-left { display:flex;flex-direction:column;align-items:center;gap:8px; }
.pf-right { display:grid;gap:10px; }

.avatar { width:120px;height:120px;border-radius:999px;background:#f3f4f6;border:2px solid #eee;display:grid;place-items:center;overflow:hidden;color:#999;font-size:36px; }
.field { display:grid;gap:6px; }
.field.two { grid-template-columns:1fr 1fr;gap:8px; }
.label { font-size:12px;color:#444;font-weight:700; }
.input { width:100%;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font:inherit; }
.row { display:flex;align-items:center;gap:8px; }
.hint { color:#777;font-size:12px; }
.muted { color:#666;font-size:12px; }

.btn { padding:10px 14px;border-radius:12px;border:1px solid transparent;background:var(--button-color);color:var(--secondary-text-color);font-weight:700;cursor:pointer; }
.btn:disabled{opacity:.7;cursor:not-allowed;}
.btn.btn-secondary{background:#fff;color:#111;border:1px solid #e5e7eb;}
.btn.btn-plain{background:#fff;color:#111;border:1px solid #e5e7eb;}

@media (max-width: 720px){ .profile{grid-template-columns:1fr;} }
</style>
