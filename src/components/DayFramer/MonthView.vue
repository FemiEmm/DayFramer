<template>
  <div class="month-view">
    <TaskMaker />

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <h2>{{ displayMonth }} {{ displayYear }}</h2>
    <div class="day-labels">
      <div v-for="day in daysOfWeek" :key="day" class="day-label">{{ day }}</div>
    </div>
    <div class="calendar-grid">
      <!-- Empty boxes for alignment based on the first day of the month -->
      <div v-for="n in firstDayOffset" :key="'empty-' + n" class="day-box empty"></div>

      <!-- Actual days of the month -->
      <router-link
        v-for="day in daysInMonth"
        :key="day"
        :to="{ name: 'DayView', params: { day, month: displayMonth, year: displayYear } }"
        class="day-box"
      >
        <div class="day-title">{{ day }}</div>
        <div class="day-content">
          <!-- Display tasks grouped by their type -->
          <div v-for="task in tasksByDay[day]" :key="task.id" class="task">
            <strong>{{ task.type }}:</strong> {{ task.task_text }}
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, onMounted, watch } from "vue";
import { supabase } from "@/lib/supabase"; // Your Supabase instance
import TaskMaker from "./TaskMaker.vue";

export default defineComponent({
  name: "MonthView",
  components: {
    TaskMaker,
  },
  props: {
    month: {
      type: String as PropType<string>,
      default: "",
    },
    year: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const displayMonth = ref(props.month);
    const displayYear = ref(props.year);
    const tasksByDay = ref({}); // To store tasks grouped by day
    const loading = ref(false); // Loading state

    // Watch for changes to month/year props
    watch(
      () => props.month,
      (newMonth) => {
        if (newMonth) {
          displayMonth.value = newMonth;
          fetchTasksForMonth();
        }
      }
    );

    watch(
      () => props.year,
      (newYear) => {
        if (newYear) {
          displayYear.value = newYear;
          fetchTasksForMonth();
        }
      }
    );

    // Compute the number of days in the current month
    const daysInMonth = computed(() => {
      const monthIndex = new Date(`${displayMonth.value} 1, ${displayYear.value}`).getMonth();
      return new Date(displayYear.value, monthIndex + 1, 0).getDate();
    });

    // Compute the first day offset for alignment
    const firstDayOffset = computed(() => {
      const monthIndex = new Date(`${displayMonth.value} 1, ${displayYear.value}`).getMonth();
      const firstDay = new Date(displayYear.value, monthIndex, 1).getDay();
      return firstDay;
    });

    // Fetch all tasks and group them
    const fetchTasksForMonth = async () => {
      loading.value = true;

      const { data: user, error: userError } = await supabase.auth.getUser(); // Get the authenticated user
      const userId = user?.user?.id;

      if (!userId) {
        console.error("User not authenticated", userError);
        loading.value = false;
        return;
      }

      // Log the user ID being used
      console.log("Fetching tasks for User ID:", userId);

      const monthIndex = new Date(`${displayMonth.value} 1, ${displayYear.value}`).getMonth() + 1;
      const formattedMonth = String(monthIndex).padStart(2, "0");
      const startDate = `${displayYear.value}-${formattedMonth}-01`;
      const endDate = `${displayYear.value}-${formattedMonth}-${daysInMonth.value}`;

      // Query Supabase for tasks matching the exact year, month, and day
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .or(
          `reminder_date.gte.${startDate},reminder_date.lte.${endDate},due_date.gte.${startDate},due_date.lte.${endDate},late_date.gte.${startDate},late_date.lte.${endDate}`
        );

      if (error) {
        console.error("Error fetching tasks:", error);
        loading.value = false;
        return;
      }

      console.log("Fetched tasks:", data);

      // Group tasks by day using direct date string comparison
      const tasksGrouped = {};
      for (let day = 1; day <= daysInMonth.value; day++) {
        const currentDay = `${displayYear.value}-${formattedMonth}-${String(day).padStart(2, "0")}`;
        tasksGrouped[day] = [];

        data?.forEach((task) => {
          if (task.reminder_date === currentDay) {
            tasksGrouped[day].push({ ...task, type: "Reminder" });
          }
          if (task.due_date === currentDay) {
            tasksGrouped[day].push({ ...task, type: "Due" });
          }
          if (task.late_date === currentDay) {
            tasksGrouped[day].push({ ...task, type: "Late" });
          }
        });
      }

      tasksByDay.value = tasksGrouped;
      loading.value = false;
    };

    // Fetch tasks when the component is mounted
    onMounted(fetchTasksForMonth);

    return { daysOfWeek, daysInMonth, firstDayOffset, displayMonth, displayYear, tasksByDay, loading };
  },
});
</script>

<style scoped>
.month-view {
  text-align: center;
  padding: 20px;
  background-color: var(--background-gradient);
  max-width: 90vw;
  margin: 0 auto;
}

.day-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 10px;
  font-weight: bold;
}

.day-label {
  padding: 5px;
  border-bottom: 1px solid var(--button-color);
  text-align: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr); /* 7 columns for each day of the week */
  gap: 5px;
}

.day-box {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  background-color: var(--frame2-color);
  border-radius: 3px;
  height: 100px;
  transition: transform 0.3s ease;
  text-decoration: none; /* Remove underline for router-link */
}

.day-box:hover {
  transform: scale(1.03); /* Zoom effect */
  background-color: var(--frame1-color);
}

.day-box.empty {
  background: none;
}

.day-title {
  background-color: var(--frame1-color);
  color: var(--primary-text-color);
  font-weight: bold;
  padding: 5px;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  flex: 0 0 20%; /* 20% height for the title */
  border-radius: 3px 3px 0 0;
}

.day-content {
  flex: 1; /* Take up the remaining space */
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.task {
  font-size: 0.8em;
  margin-top: 5px;
  text-align: left;
  color: var(--primary-text-color);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid var(--button-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
