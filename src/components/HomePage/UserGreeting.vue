<template>
  <div class="user-greeting" :aria-busy="loading ? 'true' : 'false'">
    <i class="icon fa fa-user"></i>
    <span class="text">Hello, {{ userName }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from "vue";
import { supabase } from "@/lib/supabase"; // change if your client file is named differently

type ProfileRow = { display_name: string | null };

export default defineComponent({
  name: "UserGreeting",
  setup() {
    const profileName = ref<string | null>(null);
    const loading = ref(true);

    async function loadProfileName() {
      loading.value = true;

      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        profileName.value = null; // not signed in
        loading.value = false;
        return;
      }

      // Read display_name from profiles (fallback handled in computed)
      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", uid)
          .maybeSingle<ProfileRow>();

        profileName.value = data?.display_name?.trim() || null;
      } catch {
        profileName.value = null; // on any error, show default
      } finally {
        loading.value = false;
      }
    }

    // Keep in sync with auth changes
    let unsubscribe: (() => void) | undefined;
    onMounted(async () => {
      await loadProfileName();
      const { data } = supabase.auth.onAuthStateChange(async () => {
        await loadProfileName();
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    onBeforeUnmount(() => unsubscribe?.());

    const userName = computed(() => profileName.value || "User");

    return { userName, loading };
  },
});
</script>

<style scoped>
.user-greeting {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  color: var(--button-color);
  cursor: default;
}
.user-greeting .icon { font-size: 1.5em; }
</style>

<style>
.user-greeting {
  z-index: 1000;
  font-size: 14px;
}
</style>
