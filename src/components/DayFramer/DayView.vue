<template>
  <DashBoard />
  <div class="dayview">
    <!-- Header with Back Button, Dayframer, and Date -->
    <header class="header">
      <button @click="goBack" class="back-button">Back</button>
      <span class="date">{{ formattedDate }}</span>
    </header>

    <!-- Message if not signed in -->
    <div v-if="!isAuthenticated" class="not-signed-in">
      You are not signed in.
    </div>

    <!-- Tasks List -->
    <div v-else class="task-list">
      <div v-if="loading" class="loading">Loading tasks...</div>
      <div v-else-if="tasks.length === 0" class="no-tasks">No tasks for this day</div>
      <div v-else class="tasks">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
        >
          <div class="task-details">
            <span class="task-text">
              <strong>{{ task.type }}:</strong> {{ task.task_text }}
            </span>
          </div>
          <div class="task-actions">
            <input
              type="checkbox"
              v-model="task.is_completed"
              @change="markAsComplete(task)"
            />
            <button @click="deleteTask(task.id)" class="delete-button">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import DashBoard from "../DashBoard.vue";
import { supabase } from "@/lib/supabase";

export default defineComponent({
  name: "DayView",
  components: { DashBoard },
  props: {
    day: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const formattedDate = `${props.year}-${String(props.month).padStart(2, "0")}-${String(props.day).padStart(2, "0")}`;
    const tasks = ref([]);
    const loading = ref(true);
    const isAuthenticated = ref(false);

    console.log("Displaying tasks for date:", formattedDate);

    // Fetch tasks for the given day
    const fetchTasks = async () => {
      const userId = localStorage.getItem("userId");

      // Check for the user ID in local storage
      if (!userId) {
        console.error("No user ID found in local storage.");
        isAuthenticated.value = false;
        return;
      }

      isAuthenticated.value = true;
      loading.value = true;

      try {
        console.log("Fetching tasks for User ID:", userId);

        // Fetch tasks for the specific date using the user ID
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .or(
            `reminder_date.eq.${formattedDate},due_date.eq.${formattedDate},late_date.eq.${formattedDate}`
          )
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching tasks:", error);
        } else {
          tasks.value = data.map((task) => {
            if (task.reminder_date === formattedDate) {
              return { ...task, type: "Reminder" };
            }
            if (task.due_date === formattedDate) {
              return { ...task, type: "Due" };
            }
            if (task.late_date === formattedDate) {
              return { ...task, type: "Late" };
            }
            return task;
          });
          console.log("Fetched tasks:", tasks.value);
        }
      } catch (err) {
        console.error("Unexpected error during task fetch:", err);
      } finally {
        loading.value = false;
      }
    };

    // Mark a task as completed
    const markAsComplete = async (task) => {
      try {
        const { error } = await supabase
          .from("tasks")
          .update({ is_completed: task.is_completed })
          .eq("id", task.id);

        if (error) {
          console.error("Error updating task:", error);
          alert("Failed to update task");
        } else {
          console.log("Task marked as completed:", task.id);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    // Delete a task
    const deleteTask = async (taskId) => {
      try {
        const { error } = await supabase.from("tasks").delete().eq("id", taskId);

        if (error) {
          console.error("Error deleting task:", error);
          alert("Failed to delete task");
        } else {
          tasks.value = tasks.value.filter((task) => task.id !== taskId);
          console.log("Task deleted:", taskId);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    // Navigate back
    const goBack = () => {
      router.back();
    };

    // Fetch tasks on mount
    onMounted(fetchTasks);

    return {
      formattedDate,
      tasks,
      loading,
      isAuthenticated,
      fetchTasks,
      markAsComplete,
      deleteTask,
      goBack,
    };
  },
});
</script>

<style scoped>
.dayview {
  padding: 20px 50px 20px 100px;
  font-family: "Epilogue", sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  background-color: var(--button-color);
  color: var(--primary-text-color);
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.date {
  font-size: 1.2em;
  font-weight: bold;
  color: var(--primary-text-color);
}

.task-list {
  margin-top: 20px;
}

.loading {
  text-align: center;
  font-size: 1.2em;
  color: var(--secondary-text-color);
}

.no-tasks {
  text-align: center;
  font-size: 1em;
  color: var(--secondary-text-color);
}

.tasks {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 5px;
  padding: 10px;
  background-color: var(--frame1-color); /* Uniform background color for all tasks */
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.task-item:hover {
  transform: scale(1.01);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-button {
  background-color: red;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.delete-button:hover {
  background-color: darkred;
}

.not-signed-in {
  text-align: center;
  font-size: 1.2em;
  color: red;
  margin-top: 20px;
}
</style>
