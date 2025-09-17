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
      </div>
    </div>

    <!-- Footer: Help & About (kept inline) -->
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
  </div>
</template>

<script setup lang="ts">
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

const router = useRouter();
function goWip() { router.push({ name: "WIP" }); }
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

/* Footer (like Onboarding) */
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

@media (max-width: 720px) {
  .settings { padding: 16px 16px 16px 100px; }
  .footer-links { margin-left: 100px; }
}
</style>
