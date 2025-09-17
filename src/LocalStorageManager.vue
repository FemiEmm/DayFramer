<template>
  <DashBoard />
  <div class="local-storage-manager">
    <h2>Local Storage Manager</h2>
    <div v-if="storedData && Object.keys(storedData).length > 0">
      <ul>
        <li v-for="(tasks, date) in storedData" :key="date">
          <strong>{{ date }}:</strong>
          <ul>
            <li v-for="(task, index) in tasks" :key="index">
              <span>{{ task.text }} - {{ task.completed ? 'Completed' : 'Pending' }}</span>
              <div v-if="task.reminderNotification && task.reminderNotification.date">
                Reminder: {{ task.reminderNotification.date }} at {{ task.reminderNotification.time }}
              </div>
              <div v-if="task.lateNotification && task.lateNotification.date">
                Late Notification: {{ task.lateNotification.date }} at {{ task.lateNotification.time }}
              </div>
              <button @click="deleteTask(date, index)">Delete Task</button>
            </li>
          </ul>
          <button @click="deleteDate(date)">Delete All Tasks for {{ date }}</button>
        </li>
      </ul>
    </div>
    <p v-else>No task data in local storage.</p>
  </div>
</template>

<script>
import DashBoard from './components/DashBoard.vue';
export default {
  name: "LocalStorageManager",
  components: {
    DashBoard,
  },
  data() {
    return {
      storedData: {} // Store tasks data, grouped by date
    };
  },
  methods: {
    loadStoredData() {
      const data = {};
      Object.keys(localStorage).forEach((key) => {
        console.log(`Key in Local Storage: ${key}`); // Log each key for debugging
        try {
          const tasks = JSON.parse(localStorage.getItem(key));
          console.log(`Tasks for ${key}:`, tasks); // Log each set of tasks for verification
          if (Array.isArray(tasks)) {
            data[key] = tasks.map(task => ({
              text: task.text,
              completed: task.completed,
              reminderNotification: task.reminderNotification || { date: "", time: "" },
              lateNotification: task.lateNotification || { date: "", time: "" }
            }));
          }
        } catch (error) {
          console.error(`Error parsing tasks for ${key}:`, error);
        }
      });
      this.storedData = data;
      console.log("Stored Data:", this.storedData); // Final log to verify loaded data structure
    },
    deleteTask(date, index) {
      const tasks = this.storedData[date];
      tasks.splice(index, 1); // Remove task from array
      localStorage.setItem(date, JSON.stringify(tasks)); // Save updated tasks
      this.loadStoredData(); // Refresh displayed data
    },
    deleteDate(date) {
      localStorage.removeItem(date); // Remove all tasks for the given date
      this.loadStoredData(); // Refresh displayed data
    }
  },
  mounted() {
    this.loadStoredData();
  }
};
</script>

<style scoped>
.local-storage-manager {
  padding: 20px;
  background-color: #f3f3f3;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button {
  margin-left: 10px;
}

ul {
  list-style-type: none;
}

li {
  margin-bottom: 10px;
}
</style>
