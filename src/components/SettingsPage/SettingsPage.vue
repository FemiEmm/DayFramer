<!-- src/components/SettingsPage/SettingsPage.vue -->
<template>
  <div class="settings-page">
    <!-- Fixed sidebar -->
    <DashBoard />

    <!-- Main content -->
    <div class="settings">
      <div class="container">
        <SettingsProfileCard />
        <SettingsTeamCard />
        <SettingsNotificationsCard />
        <SettingsAppearanceCard />
        <SettingsSecurityCard />
        <SettingsDataPrivacyCard />
        <SettingsBillingCard />

        <!-- Danger Zone (AFTER Billing) -->
        <section class="danger-card">
          <h2 class="danger-title">Delete account</h2>
          <p class="danger-copy">
            Permanently delete your data. This removes rows tied to your user ID (tasks, personal plan, team memberships, your profile, and any teams you own).
            Action cannot be undone.
          </p>

          <div class="danger-actions">
            <button class="delete-btn" @click="openDeleteModal" :disabled="deleting">
              {{ deleting ? 'Working…' : 'Delete my account' }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer-links">
      <div class="links-grid">
        <div class="group">
          <div class="gh">Help & About</div>
          <a href="#" class="gl" @click.prevent="goWip">Help / guide</a>
          <a href="#" class="gl" @click.prevent="goWip">Contact support</a>
          <a href="#" class="gl" @click.prevent="goWip">Changelog</a>
          <span class="gl">App version: 0.1.0</span>
          <a href="#" class="gl" @click.prevent="goWip">Terms & Privacy</a>
        </div>
        <div class="group">
          <div class="gh">Resources</div>
          <a href="#" class="gl" @click.prevent="goWip">Status</a>
          <a href="#" class="gl" @click.prevent="goWip">Developer API</a>
          <a href="#" class="gl" @click.prevent="goWip">Integrations</a>
        </div>
        <div class="group">
          <div class="gh">Company</div>
          <a href="#" class="gl" @click.prevent="goWip">About</a>
          <a href="#" class="gl" @click.prevent="goWip">Careers</a>
          <a href="#" class="gl" @click.prevent="goWip">Press</a>
        </div>
      </div>
    </footer>

    <!-- Confirm Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal" @click.stop>
        <!-- Circular image on top -->
        <div class="modal-icon-wrap">
          <img :src="currentDeleteImg" alt="Delete action" />
        </div>

        <h3 class="modal-title">Delete your account?</h3>
        <p class="modal-copy">
          This will permanently remove your data. This cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-danger" @click="confirmDelete" :disabled="deleting">
            {{ deleting ? 'Deleting…' : 'Delete anyway' }}
          </button>
          <button class="btn-cancel" @click="closeDeleteModal" :disabled="deleting">
            Cancel
          </button>
        </div>

        <p v-if="deleteError" class="error">
          {{ deleteError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import DashBoard from "@/components/DashBoard.vue";

/* Sections */
import SettingsProfileCard from "./SettingsProfileCard.vue";
import SettingsTeamCard from "./SettingsTeamCard.vue";
import SettingsNotificationsCard from "./SettingsNotificationsCard.vue";
import SettingsAppearanceCard from "./SettingsAppearanceCard.vue";
import SettingsSecurityCard from "./SettingsSecurityCard.vue";
import SettingsDataPrivacyCard from "./SettingsDataPrivacyCard.vue";
import SettingsBillingCard from "./SettingsBillingCard.vue";

import { supabase } from "@/lib/supabase";

const router = useRouter();
function goWip() { router.push({ name: "WIP" }); }

/* Delete account state */
const showDeleteModal = ref(false);
const deleting = ref(false);
const deleteError = ref("");

/* Top-of-modal images (from public/interaction) */
const deleteImg = "/Interaction/DeleteAction.png";
const deleteImg2 = "/Interaction/DeleteAction2.png";
const currentDeleteImg = ref<string>(deleteImg);

function openDeleteModal() {
  deleteError.value = "";
  currentDeleteImg.value = deleteImg; // reset to initial image when opening
  showDeleteModal.value = true;
}
function closeDeleteModal() {
  if (!deleting.value) showDeleteModal.value = false;
}

/**
 * Delete helpers
 * NOTE: Adjust table/column names to match your schema exactly.
 */
async function deleteRows(table: string, column: string, value: string) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  return error ?? null;
}

async function confirmDelete() {
  deleteError.value = "";
  deleting.value = true;

  try {
    // Swap image to DeleteAction2 first (small visual feedback), then proceed.
    currentDeleteImg.value = deleteImg2;
    await new Promise((r) => setTimeout(r, 400));

    // Get current user id
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) throw new Error("No user session.");

    // Load teams owned by this user first to cascade deletes safely
    const { data: ownedTeams } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", uid);

    const ownedTeamIds = (ownedTeams ?? []).map((t: any) => t.id);

    // 1) Delete team-related data for teams you own
    if (ownedTeamIds.length) {
      try { await supabase.from("team_plan_entries").delete().in("team_id", ownedTeamIds); } catch {}
      try { await supabase.from("team_members").delete().in("team_id", ownedTeamIds); } catch {}
      try { await supabase.from("teams").delete().in("id", ownedTeamIds); } catch {}
    }

    // 2) Delete user-linked rows across your app tables
    const plan: Array<{table: string; column: string}> = [
      { table: "tasks",                  column: "user_id" },
      { table: "personal_plan_entries",  column: "owner_user_id" },
      { table: "team_members",           column: "user_id" },
      { table: "profiles",               column: "id" },
      // If tasks.assigned_to stores user_id, also delete on that column:
      // { table: "tasks",               column: "assigned_to" },
    ];
    for (const { table, column } of plan) {
      try { await deleteRows(table, column, uid); } catch {}
    }

    // 3) Sign out and route to Welcome (signin mode)
    try { await supabase.auth.signOut(); } catch {}
    try {
      await router.replace({ name: "Welcome", query: { mode: "signin" } });
    } catch {
      window.location.href = "/?mode=signin";
    }
  } catch (err: any) {
    deleteError.value = err?.message || "Delete failed. Please try again.";
  } finally {
    deleting.value = false;
    showDeleteModal.value = false;
  }
}
</script>

<style scoped>
/* Page shell with sidebar */
.settings-page {
  min-height: 100svh; min-height: 100dvh; min-height: 100vh;
  background: var(--background-color);
}

/* Main content area (offset for sidebar) */
.settings {
  padding: 24px 24px 24px 150px; /* left pad so content doesn't sit under fixed sidebar */
}

/* Grid */
.container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
}

/* Danger Zone */
.danger-card {
  border: 1px solid #fee2e2;
  background: #fff5f5;
  border-radius: 16px;
  padding: 18px 16px;
}
.danger-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 900;
  color: #7f1d1d;
}
.danger-copy {
  margin: 0 0 14px 0;
  color: #991b1b;
  font-size: 14px;
}
.danger-actions {
  display: flex;
  justify-content: center;   /* centered button */
  align-items: center;
}
.delete-btn {
  appearance: none;
  border: 1px solid #ef4444;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  min-width: 220px;
}
.delete-btn:hover { background: #dc2626; border-color: #dc2626; }
.delete-btn:disabled { opacity: .7; cursor: not-allowed; }

/* Footer */
.footer-links {
  padding: 40px clamp(20px, 6vw, 80px);
  background: var(--frame1-color);
  color: var(--primary-text-color);
  border-top: 1px solid rgba(0,0,0,.06);
  margin-left: 150px; /* offset for sidebar */
}
.links-grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 28px 40px;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
}
.group { display: grid; gap: 8px; }
.gh { font-weight: 800; font-size: 14px; text-transform: uppercase; opacity: .8; margin-bottom: 8px; }
.gl { font-size: 14px; color: var(--primary-text-color); opacity: .85; cursor: pointer; text-decoration: none; }
.gl:hover { opacity: 1; }

/* Confirm Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal {
  background-color: var(--background-color);
  padding: 20px; border-radius: 12px;
  box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.25);
  text-align: center; width: min(420px, 92vw);
  border: 1px solid rgba(0,0,0,.06);
  position: relative;
}

/* Circular image at top of modal */
.modal-icon-wrap {
  width: 96px; height: 96px;
  border-radius: 999px;
  overflow: hidden;
  border: 3px solid #fee2e2;
  background: #fff;
  display: grid;
  place-items: center;
  margin: -70px auto 10px auto; /* pull upward so it sits above modal top */
  box-shadow: 0 8px 22px rgba(0,0,0,.18);
}
.modal-icon-wrap img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}

.modal-title { margin: 6px 0 6px 0; font-weight: 900; font-size: 18px; }
.modal-copy { margin: 0 0 16px 0; font-size: 14px; color: var(--secondary-text-color); }
.modal-actions {
  display: flex; gap: 10px; justify-content: center; align-items: center;
  margin-top: 6px;
}
.btn-danger {
  border: 1px solid #ef4444; background: #ef4444; color: #fff;
  border-radius: 999px; padding: 8px 14px; font-weight: 800; cursor: pointer;
}
.btn-danger:hover { background: #dc2626; border-color: #dc2626; }
.btn-danger:disabled { opacity: .7; cursor: not-allowed; }
.btn-cancel {
  border: 1px solid #e5e7eb; background: #fff; color: #111;
  border-radius: 999px; padding: 8px 14px; font-weight: 700; cursor: pointer;
}
.btn-cancel:hover { background: #f5f5f5; }
.error { margin-top: 10px; color: #b91c1c; font-size: 13px; }

/* Place the modal image nicely even on small screens */
@media (max-width: 520px) {
  .modal-icon-wrap {
    width: 84px; height: 84px; margin-top: -64px;
  }
}

@media (max-width: 720px) {
  .settings { padding: 16px 16px 16px 100px; }
  .footer-links { margin-left: 100px; }
  .container { grid-template-columns: 1fr; }
}
</style>
