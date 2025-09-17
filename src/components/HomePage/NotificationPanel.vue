<template>
  <div class="notification-panel">
    <h2>Today's Notifications</h2>
    <p class="current-date">{{ currentDate }}</p>

    <!-- Tasks Due Today -->
    <h3>Tasks Due Today</h3>
    <div v-if="tasksDueToday.length > 0">
      <ul>
        <li v-for="(task, index) in tasksDueToday" :key="index">
          {{ task.text }} - Due at {{ task.reminderNotification.time }}
        </li>
      </ul>
    </div>
    <div v-else class="no-task-message">
      <p>No tasks are due for today.</p>
    </div>

    <!-- Notifications -->
    <h3>Upcoming Notifications</h3>
    <div v-if="notifications.length > 0">
      <div
        v-for="(notification, index) in notifications"
        :key="index"
        :class="['notification', notification.color]"
      >
        <p>{{ notification.message }}</p>
      </div>
    </div>
    <div v-else class="no-task-message">
      <p>You have no notifications at this time.</p>
    </div>

    <!-- Button to create notifications for all tasks in local storage -->
    <button @click="createNotificationsForAllTasks" class="create-notifications-button">
      Create Notifications for All Stored Tasks
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";

export default defineComponent({
  name: "NotificationPanel",
  setup() {
    const notifications = ref([]);
    const tasksDueToday = ref([]);
    const currentDate = ref("");

    // Function to format the current date and time
    const getCurrentDate = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return now.toLocaleDateString("en-US", options);
    };

    // Ensure date format consistency in storage and retrieval
    const getFormattedDate = (dateObj: Date) => {
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Load tasks due today from local storage
    const loadTasksDueToday = () => {
      const today = new Date();
      const formattedToday = getFormattedDate(today);

      tasksDueToday.value = [];
      const storedTasks = localStorage.getItem(formattedToday);

      if (storedTasks) {
        const tasks = JSON.parse(storedTasks) || [];
        tasks.forEach((task) => {
          if (task.reminderNotification && task.reminderNotification.date === formattedToday) {
            tasksDueToday.value.push(task);
          }
        });
      }
    };

    // Create notifications for all tasks in local storage
    const createNotificationsForAllTasks = () => {
      notifications.value = []; // Clear existing notifications

      Object.keys(localStorage).forEach((key) => {
        try {
          const tasks = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(tasks)) {
            tasks.forEach((task) => {
              if (task.reminderNotification && task.reminderNotification.date) {
                const notificationDateTime = new Date(
                  `${task.reminderNotification.date}T${task.reminderNotification.time}`
                );
                const timeDifference = (notificationDateTime.getTime() - new Date().getTime()) / (1000 * 60);

                let color = "green"; // Default color for non-urgent notifications
                if (timeDifference < 60) {
                  color = "red"; // Red for urgent notifications
                } else if (timeDifference < 1440) {
                  color = "yellow"; // Yellow for less urgent notifications
                }

                notifications.value.push({
                  message: `Task "${task.text}" is scheduled for ${task.reminderNotification.date} at ${task.reminderNotification.time}.`,
                  color: color,
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error parsing tasks for ${key}:`, error);
        }
      });
    };

    onMounted(() => {
      currentDate.value = getCurrentDate();
      loadTasksDueToday();
    });

    return {
      notifications,
      tasksDueToday,
      currentDate,
      createNotificationsForAllTasks,
    };
  },
});
</script>

<style scoped>
.notification-panel {
  padding: 20px;
  font-family: 'Epilogue', sans-serif;
  background-color: var(--background-color);
  border-radius: 5px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

.notification-panel h2 {
  font-size: 1.5em;
  color: var(--primary-text-color);
  margin-bottom: 5px;
}

.current-date {
  font-size: 1.1em;
  color: var(--secondary-text-color);
  margin-bottom: 15px;
}

h3 {
  font-size: 1.2em;
  color: var(--primary-text-color);
  margin-top: 20px;
}

.create-notifications-button {
  background-color: var(--button-color);
  color: var(--primary-text-color);
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 15px;
}

.create-notifications-button:hover {
  background-color: var(--button-hover-color);
}

.notification {
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  font-weight: bold;
}

.notification.red {
  background-color: #ff6b6b; /* Red for urgent notifications */
  color: #fff;
}

.notification.yellow {
  background-color: #ffd166; /* Yellow for less urgent notifications */
  color: #333;
}

.notification.green {
  background-color: #a8e6cf; /* Green for non-urgent notifications */
  color: #333;
}

.no-task-message {
  text-align: center;
  font-size: 1.2em;
  color: var(--secondary-text-color);
}
</style>
