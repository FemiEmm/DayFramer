<!-- src/components/Onboarding/ProfileSetupCard.vue -->
<template>
  <div class="center-wrap">
    <div class="card">
      <h2>Finish setting up your account</h2>
      <!-- Avatar / illustration -->
      <div class="avatar-wrap">
        <div class="avatar-circle" :class="{ pop: popping }" @animationend="onPopEnd">
          <img :src="currentImg" alt="Progress illustration" class="avatar-img" />
        </div>
      </div>

      <form class="form" @submit.prevent="save">
        <div class="grid">
          <div>
            <label class="label" for="fn">First name</label>
            <input id="fn" class="input" v-model.trim="firstName" placeholder="John" required />
          </div>
          <div>
            <label class="label" for="ln">Last name</label>
            <input id="ln" class="input" v-model.trim="lastName" placeholder="Doe" required />
          </div>
        </div>

        <label class="label" for="dn">What should we call you?</label>
        <input id="dn" class="input" v-model.trim="displayName" placeholder="Janie / Jane / JD" required />

        <button class="btn" type="submit" :disabled="saving">
          <span v-if="saving">Saving…</span>
          <span v-else>Save only</span>
        </button>

        <p v-if="err" class="err">{{ err }}</p>
      </form>
    </div>

    <!-- Success modal -->
    <div v-if="showNextModal" class="modal-overlay" @click.self="showNextModal = false">
      <div class="modal">
        <h3>Profile successfully set up</h3>
        <p class="modal-sub">Where do you want to go next?</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="go('Onboarding')">Onboarding</button>
          <button class="btn" @click="go('Homepage')">Home</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

/* Move files from /public/interaction to /src/assets/interaction first */
import lookdownImg from "@/assets/interaction/lookdown.png";
import welldoneImg from "@/assets/interaction/welldone.png";

const router = useRouter();

// form state
const firstName = ref("");
const lastName = ref("");
const displayName = ref("");

const saving = ref(false);
const err = ref("");

const showNextModal = ref(false);

// avatar state
const currentImg = ref<string>(lookdownImg);
const popping = ref(false);

async function save() {
  err.value = "";
  saving.value = true;
  try {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) throw new Error("No session");

    const payload = {
      id: uid,
      first_name: firstName.value,
      last_name: lastName.value,
      display_name: displayName.value,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) throw error;

    // Success → swap image and pop
    currentImg.value = welldoneImg;
    popping.value = false;
    await nextTick();
    popping.value = true;
  } catch {
    err.value = "Could not save your profile. Please try again.";
    currentImg.value = lookdownImg;
  } finally {
    saving.value = false;
  }
}

function onPopEnd() {
  if (popping.value) {
    popping.value = false;
    showNextModal.value = true;
  }
}

function go(routeName: "Onboarding" | "Homepage") {
  showNextModal.value = false;
  router.push({ name: routeName });
}
</script>

<style scoped>
.center-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--background-color);
  padding: 50px;
}


.card {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.08);
  padding: 20px;
  height: clamp(380px, 60vh, 560px);
}

.title { margin: 0 0 12px; font-weight: 800; text-align: center; }

.avatar-wrap { display: grid; place-items: center; margin: 6px 0 14px; }
.avatar-circle {
  width: 120px; height: 120px; border-radius: 999px;
  border: 2px solid #f0f0f0; background: #fafafa;
  display: grid; place-items: center; overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
  will-change: transform;
}
.avatar-img { width: 100%; height: auto; object-fit: cover; }

@keyframes bubbleZoom {
  0% { transform: scale(1); }
  25% { transform: scale(1.20); }
  50% { transform: scale(0.95); }
  75% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.avatar-circle.pop { animation: bubbleZoom 900ms ease-in-out 1; }

.form { display: grid; gap: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.label { font-size: 12px; color: #444; font-weight: 600; display: block; }
.input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; }

.btn {
  margin-top: 10px; padding: 12px 16px; border-radius: 12px;
  border: 1px solid transparent; background: var(--button-color);
  color: var(--secondary-text-color); cursor: pointer; font-weight: 700;
}
.btn[disabled] { opacity: .7; cursor: not-allowed; }
.btn.btn-secondary { background: #fff; color: #111; border: 1px solid #e5e7eb; }

.err { color: #d32f2f; font-size: 13px; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: grid; place-items: center; padding: 16px; z-index: 50;
}
.modal {
  width: 100%; max-width: 420px; background: #fff; border-radius: 14px;
  border: 1px solid #eee; box-shadow: 0 20px 60px rgba(0,0,0,.15);
  padding: 20px; text-align: center;
}
.modal-sub { color: #555; margin: 6px 0 14px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }

@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
</style>
