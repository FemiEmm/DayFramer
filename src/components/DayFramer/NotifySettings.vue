<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <h3>Notification Settings</h3>

      <div class="notification-settings">
        <div class="notification-option">
          <label for="early-notice">Early Notice</label>
          <input type="date" v-model="earlyNotice.date" />
          <input type="time" v-model="earlyNotice.time" />
          <button @click="confirmNotice('early')">OK</button>
        </div>

        <div class="notification-option">
          <label for="follow-up-notice">Follow-Up Notice</label>
          <input type="date" v-model="followUpNotice.date" />
          <input type="time" v-model="followUpNotice.time" />
          <button @click="confirmNotice('followUp')">OK</button>
        </div>

        <div class="notification-option">
          <label for="final-notice">Final Notice</label>
          <input type="date" v-model="finalNotice.date" />
          <input type="time" v-model="finalNotice.time" />
          <button @click="confirmNotice('final')">OK</button>
        </div>
      </div>

      <button @click="saveSettings" class="save-button">Save</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "NotifySettings",
  props: {
    taskIndex: {
      type: Number,
      required: true,
    },
  },
  setup(props, { emit }) {
    const route = useRoute();
    const day = route.params.day;
    const month = route.params.month;
    const year = route.params.year;
    const folderName = `${day}-${month}-${year}`;
    
    const earlyNotice = ref({ date: "", time: "" });
    const followUpNotice = ref({ date: "", time: "" });
    const finalNotice = ref({ date: "", time: "" });
    
    // Load settings from localStorage on mount
    onMounted(() => {
      const storedSettings = localStorage.getItem(folderName);
      if (storedSettings) {
        const savedSettings = JSON.parse(storedSettings)[`task${props.taskIndex}`] || {};
        earlyNotice.value = savedSettings.earlyNotice || { date: "", time: "" };
        followUpNotice.value = savedSettings.followUpNotice || { date: "", time: "" };
        finalNotice.value = savedSettings.finalNotice || { date: "", time: "" };
      }
    });
    
    // Save individual notice settings on "OK" button click
    const confirmNotice = (type) => {
      const notificationSettings = {
        earlyNotice: earlyNotice.value,
        followUpNotice: followUpNotice.value,
        finalNotice: finalNotice.value,
      };

      const storedData = JSON.parse(localStorage.getItem(folderName) || "{}");
      storedData[`task${props.taskIndex}`] = notificationSettings;
      localStorage.setItem(folderName, JSON.stringify(storedData));
    };
    
    // Save all settings to localStorage under the task index
    const saveSettings = () => {
      confirmNotice(); // Save all changes
      emit("close"); // Close the modal after saving
    };
    
    const closeModal = () => {
      emit("close");
    };
    
    return {
      earlyNotice,
      followUpNotice,
      finalNotice,
      saveSettings,
      closeModal,
      confirmNotice,
    };
  },
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: var(--background-color);
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.notification-settings {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.notification-option {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-weight: bold;
  color: var(--primary-text-color);
}

input[type="date"],
input[type="time"] {
  padding: 5px;
  border: 1px solid var(--secondary-text-color);
  border-radius: 5px;
  color: var(--primary-text-color);
  background-color: var(--background-color);
}

button {
  background-color: var(--button-color);
  color: var(--primary-text-color);
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: var(--button-hover-color);
}

.save-button {
  margin-top: 15px;
}
</style>
