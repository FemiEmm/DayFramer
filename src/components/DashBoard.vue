<template>
  <nav class="dashboard" aria-label="Primary">
    <div class="brand">
      <button @click="navigateTo('Onboarding')" class="navbtn" aria-label="Dayframe">
        <i class="icon fa-solid fa-calendar-days" aria-hidden="true"></i>
        <span class="text">Dayframe</span>
      </button>
    </div>

    <hr class="sep-line" />

    <ul class="menu">
      <li>
        <button @click="navigateTo('Homepage')" class="navbtn" aria-label="Home">
          <i class="icon fa fa-home" aria-hidden="true"></i>
          <span class="text">Home</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('Dayframer')" class="navbtn" aria-label="Dayframer">
          <i class="icon fa fa-user" aria-hidden="true"></i>
          <span class="text">Dayframer</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('Monthly')" class="navbtn" aria-label="Monthly">
          <i class="icon fa fa-calendar" aria-hidden="true"></i>
          <span class="text">Monthly</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('TeamManagement')" class="navbtn" aria-label="Team">
          <i class="icon fa fa-cogs" aria-hidden="true"></i>
          <span class="text">Team</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('PlanPage')" class="navbtn" aria-label="Plan">
          <i class="icon fa fa-tasks" aria-hidden="true"></i>
          <span class="text">Plan</span>
        </button>
      </li>

      <li>
        <button @click="toggleTheme" class="navbtn" aria-label="Toggle theme">
          <i class="icon fa fa-adjust" aria-hidden="true"></i>
          <span class="text">Theme</span>
        </button>
      </li>
      <li>
        <button @click="goSettings" class="navbtn" aria-label="Settings">
          <i class="icon fa fa-cog" aria-hidden="true"></i>
          <span class="text">Settings</span>
        </button>
      </li>
    </ul>

    <hr class="sep-line" />

    <div class="bottom">
      <button @click="openSignOutModal" class="navbtn" aria-label="Sign out">
        <i class="icon fa fa-sign-out-alt" aria-hidden="true"></i>
        <span class="text">Sign Out</span>
      </button>
    </div>

    <div
      v-if="showSignOutModal"
      class="modal-overlay"
      @click="closeSignOutModal"
      role="dialog"
      aria-modal="true"
      aria-label="Sign out"
    >
      <div class="modal" @click.stop>
        <h3>Sign Out</h3>
        <p>Are you sure you want to sign out?</p>
        <button
          @click="signOut"
          class="confirm-button"
          :disabled="signingOut"
          :aria-busy="signingOut"
        >
          {{ signingOut ? 'Signing out…' : 'Yes' }}
        </button>
        <button
          @click="closeSignOutModal"
          class="cancel-button"
          :disabled="signingOut"
        >
          No
        </button>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

export default defineComponent({
  name: "Dashboard",
  setup() {
    const router = useRouter();

    const showSignOutModal = ref(false);
    const signingOut = ref(false);

    const navigateTo = (routeName: string) => router.push({ name: routeName });
    const goSettings  = () => router.push({ name: "Settings" });
    const toggleTheme = () => document.documentElement.classList.toggle("dark-theme");

    const openSignOutModal  = () => { showSignOutModal.value = true; };
    const closeSignOutModal = () => { if (!signingOut.value) showSignOutModal.value = false; };

    const purgeSupabaseTokens = () => {
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("sb-") && k.includes("auth-token")) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {}
    };

    const signOut = async () => {
      if (signingOut.value) return;
      signingOut.value = true;

      showSignOutModal.value = false;
      await nextTick();

      let localDone = false;
      supabase.auth
        .signOut({ scope: "local" })
        .then(() => { localDone = true; })
        .catch(() => { localDone = true; });

      setTimeout(() => {
        if (!localDone) purgeSupabaseTokens();
      }, 800);

      setTimeout(() => {
        supabase.auth.signOut().catch(() => {});
      }, 0);

      const target = { name: "Welcome", query: { mode: "signin", _r: String(Date.now()) } };
      try {
        await router.replace(target);
      } catch {
        window.location.replace(`/?mode=signin&_r=${Date.now()}`);
      } finally {
        signingOut.value = false;
      }
    };

    return {
      showSignOutModal,
      signingOut,
      navigateTo,
      goSettings,
      toggleTheme,
      openSignOutModal,
      closeSignOutModal,
      signOut,
    };
  },
});
</script>

<style scoped>
/* ===== Shell ===== */
.dashboard {
  position: fixed;
  top: 0; left: 0;
  width: 80px;
  height: 100vh;
  background-color: var(--background-color);
  color: var(--primary-text-color);
  box-shadow: 0 0 0 1px rgba(0,0,0,.04);
  overflow: hidden;
  white-space: nowrap;
  z-index: 1000;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
}
.dashboard:hover { width: 150px; }

/* Top brand, middle menu, bottom sign-out */
.brand { padding-top: 20px; }
.menu  {
  list-style: none; margin: 0; padding: 20px 0;
  display: flex; flex-direction: column; gap: 8px;
  flex: 1 1 auto;
  justify-content: center;
}
.bottom { padding-bottom: 10px; }

/* Separator */
.sep-line {
  background-color: var(--button-color);
  border: none;
  height: 2px;
  width: 80%;
  margin: 10px auto;
  transition: background-color 0.3s ease;
}

/* Shared button style (brand, items, signout all match) */
.navbtn {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  padding: 10px;
  border: none; background: none;
  color: var(--button-color);
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: color .2s ease, background-color .2s ease, transform .12s ease;
}
.navbtn:hover { color: var(--button-hover-color); transform: translateY(-1px); }

.icon { font-size: 1.2em; width: 24px; text-align: center; }
.text {
  opacity: 0;
  transform: translateX(-10px);
  transition: opacity .25s ease, transform .25s ease;
}
.dashboard:hover .text { opacity: 1; transform: translateX(0); }

/* ===== Mobile: bottom bar (icons only); brand hidden; signout at end ===== */
@media (max-width: 768px) {
  .dashboard {
    top: auto; bottom: 0; right: 0;
    width: 100%; height: 64px;
    padding: 0 8px;
    box-shadow: 0 -6px 20px rgba(0,0,0,.12);
    flex-direction: row;
    align-items: center;
  }

  .brand, .sep-line { display: none; }

  .menu {
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    padding: 0;
    gap: 4px;
    flex: 1 1 auto;
  }
  .text { display: none !important; }
  .navbtn { padding: 10px; border-radius: 999px; font-size: 12px; }

  .bottom {
    padding: 0 4px 0 6px;
  }
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: grid; place-items: center;
  z-index: 1500;
}
.modal {
  width: min(92vw, 320px);
  background: var(--background-color);
  color: var(--primary-text-color);
  padding: 20px; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
  text-align: center;
}
.confirm-button, .cancel-button {
  padding: 10px 14px;
  border: none; border-radius: 10px;
  font-weight: 800; cursor: pointer; margin: 6px;
}
.confirm-button { background-color: var(--button-color); color: var(--primary-text-color); }
.cancel-button  { background-color: var(--button-hover-color); color: #fff; }
.confirm-button[disabled] { opacity: .7; cursor: not-allowed; }
.confirm-button:hover:not([disabled]), .cancel-button:hover { filter: brightness(0.95); }
</style>
