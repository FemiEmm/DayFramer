<template>
  <div class="dashboard">
    <!-- Dayframe Logo and Text -->
    <ul class="title" @click="navigateTo('Onboarding')">
      <i class="icon fa-solid fa-calendar-days"></i>
      <span class="text">Dayframe</span>
    </ul>

    <hr />

    <!-- Navigation Menu -->
    <ul class="menu">
      <li>
        <button @click="navigateTo('Homepage')">
          <i class="icon fa fa-home"></i>
          <span class="text">Home</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('Dayframer')">
          <i class="icon fa fa-user"></i>
          <span class="text">Dayframer</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('Monthly')">
          <i class="icon fa fa-calendar"></i>
          <span class="text">Monthly</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('Homepage')">
          <i class="icon fa fa-tasks"></i>
          <span class="text">MyTodo</span>
        </button>
      </li>
      <li>
        <button @click="toggleTheme" class="theme-toggle">
          <i class="icon fa fa-adjust"></i>
          <span class="text">Theme</span>
        </button>
      </li>
      <li>
        <button @click="navigateTo('Manager')">
          <i class="icon fa fa-cogs"></i>
          <span class="text">Admin</span>
        </button>
      </li>

      <!-- Settings now routes to SettingsPage -->
      <li>
        <button @click="goSettings" class="settings">
          <i class="icon fa fa-cog"></i>
          <span class="text">Settings</span>
        </button>
      </li>
    </ul>

    <hr />

    <!-- Sign Out Button -->
    <div class="bottom-container">
      <button @click="openSignOutModal" class="sign-out">
        <i class="icon fa fa-sign-out-alt"></i>
        <span class="text">Sign Out</span>
      </button>
    </div>

    <!-- Modal for Sign Out -->
    <div v-if="showSignOutModal" class="modal-overlay" @click="closeSignOutModal">
      <div class="modal" @click.stop>
        <h3>Sign Out</h3>
        <p>Are you sure you want to sign out?</p>
        <button
          @click="signOut"
          class="confirm-button"
          :disabled="signingOut"
        >
          {{ signingOut ? 'Signing out…' : 'Yes' }}
        </button>
        <button @click="closeSignOutModal" class="cancel-button" :disabled="signingOut">No</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

export default defineComponent({
  name: "Dashboard",
  setup() {
    const router = useRouter();

    const showSignOutModal = ref(false);
    const signingOut = ref(false);

    const navigateTo = (routeName: string) => router.push({ name: routeName });
    const goSettings = () => router.push({ name: "Settings" }); // <-- routes to Settings page

    const toggleTheme = () => document.documentElement.classList.toggle("dark-theme");

    const openSignOutModal = () => { showSignOutModal.value = true; };
    const closeSignOutModal = () => { if (!signingOut.value) showSignOutModal.value = false; };

    const goWelcome = async () => {
      try {
        await router.replace({ name: "Welcome", query: { mode: "signin" } });
      } catch {
        window.location.href = "/?mode=signin";
      }
    };

    const signOut = async () => {
      signingOut.value = true;
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Sign-out error (continuing to redirect):", e);
      } finally {
        signingOut.value = false;
        showSignOutModal.value = false;
        await goWelcome();
      }
    };

    return {
      // state
      showSignOutModal,
      signingOut,
      // actions
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
.dashboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 80px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: width 0.3s ease;
  background-color: var(--background-color);
  color: var(--primary-text-color);
  overflow: hidden;
  white-space: nowrap;
  z-index: 1000;
  padding: 0 20px;
}

hr {
  background-color: var(--button-color);
  border: none;
  height: 2px;
  width: 80%;
  margin: 10px auto;
  transition: background-color 0.3s ease;
}

.dashboard:hover { width: 150px; }

.title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 20px;
  padding: 10px;
  cursor: pointer;
  transition: color 0.3s ease, background-color 0.3s ease;
  color: var(--button-color);
}
.title:hover {
  color: var(--button-hover-color);
  background-color: var(--button-color);
  border-radius: 5px;
}

.menu { list-style: none; padding: 0; margin: 0; flex-grow: 1; padding-top: 100px; }
.menu li { display: flex; align-items: center; margin: 10px 0; }

.menu button {
  display: flex;
  font-size: 14px;
  background: none;
  border: none;
  color: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s ease, background-color 0.3s ease;
  color: var(--button-color);
  padding: 10px;
  border-radius: 5px;
}
.menu button:hover { color: var(--button-hover-color); font-size: 16px; }

.icon { font-size: 1.2em; margin-right: 10px; width: 24px; text-align: center; }

.text {
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateX(-10px);
}
.dashboard:hover .text { opacity: 1; transform: translateX(0); }

.bottom-container { margin-top: auto; }

.sign-out {
  display: flex;
  align-items: center;
  color: var(--button-color);
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 5px;
}
.sign-out:hover { color: var(--button-hover-color); background-color: var(--button-color); }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal {
  background-color: var(--background-color);
  padding: 20px; border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  text-align: center; width: 300px;
}
.confirm-button, .cancel-button {
  padding: 10px 15px; border: none; border-radius: 5px;
  font-weight: bold; cursor: pointer; margin: 5px;
}
.confirm-button { background-color: var(--button-color); color: var(--primary-text-color); }
.cancel-button { background-color: var(--button-hover-color); color: white; }
.confirm-button[disabled] { opacity: 0.7; cursor: not-allowed; }
.confirm-button:hover { background-color: var(--button-hover-color); }
.cancel-button:hover { background-color: var(--button-color); }
</style>
