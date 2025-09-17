<template>
  <div>
    <!-- Add Task Button -->
    <button class="add-task-button" @click="toggleModal">
      <i class="icon fa fa-plus"></i>
    </button>

    <!-- Modal for Adding Tasks -->
    <div v-if="showModal" class="task-modal">
      <div class="modal-content">
        <!-- Top Row -->
        <div class="modal-row top-row">
          <h3>Add New Task</h3>
        </div>

        <!-- Middle Row -->
        <div class="modal-row middle-row">
          <form @submit.prevent="validateAndSaveTask">
            <!-- Task Description -->
            <div class="form-group">
              <input
                v-model="task.task_text"
                type="text"
                maxlength="100"
                placeholder="Task Description (Max 100 characters)"
                class="task-input"
                required
              />
            </div>
            <hr />

            <!-- Reminder Date and Time -->
            <div class="form-group row">
              <label>Reminder Date:</label>
              <input v-model="task.reminder_date" type="date" required />
              <label>Reminder Time:</label>
              <input v-model="task.reminder_time" type="time" required />
            </div>
            <hr />

            <!-- Due Date and Time -->
            <div class="form-group row">
              <label>Due Date:</label>
              <input v-model="task.due_date" type="date" required />
              <label>Due Time:</label>
              <input v-model="task.due_time" type="time" required />
            </div>
            <hr />

            <!-- Late Date and Time -->
            <div class="form-group row">
              <label>Late Date:</label>
              <input v-model="task.late_date" type="date" />
              <label>Late Time:</label>
              <input v-model="task.late_time" type="time" />
            </div>
            <hr />

            <!-- Error Message -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </form>
        </div>

        <!-- Bottom Row -->
        <div class=" bottom-row">
          <div class="button-column">
            <button class="save-button" @click="validateAndSaveTask">Save Task</button>
          </div>
          <div class="button-column">
            <button class="cancel-button" @click="toggleModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="success-modal">
      <div class="success-content">
        <h3>Task Saved Successfully!</h3>
        <button @click="redirectToDayframe">Okay</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { supabase } from "@/lib/supabase";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "TaskMaker",
  setup() {
    const router = useRouter();
    const showModal = ref(false);
    const showSuccessModal = ref(false);
    const errorMessage = ref("");
    const task = ref({
      task_text: "",
      reminder_date: "",
      reminder_time: "",
      due_date: "",
      due_time: "",
      late_date: "",
      late_time: "",
    });

    const toggleModal = () => {
      showModal.value = !showModal.value;
      errorMessage.value = ""; // Clear error message on modal toggle
    };

    const validateAndSaveTask = async () => {
      // Clear previous error message
      errorMessage.value = "";

      // Validation Logic
      if (task.value.reminder_date > task.value.due_date) {
        errorMessage.value = "Reminder Date must be before Due Date.";
        return;
      }

      if (task.value.late_date && task.value.late_date < task.value.reminder_date) {
        errorMessage.value = "Late Date cannot be before Reminder Date.";
        return;
      }

      if (task.value.due_date <= task.value.reminder_date) {
        errorMessage.value = "Due Date must be after Reminder Date.";
        return;
      }

      await saveTask();
    };

    const saveTask = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data?.user?.id;

      if (!userId) {
        alert("You must be signed in to save a task.");
        return;
      }

      const { error } = await supabase.from("tasks").insert([
        {
          user_id: userId,
          task_text: task.value.task_text,
          reminder_date: task.value.reminder_date,
          reminder_time: task.value.reminder_time,
          due_date: task.value.due_date,
          due_time: task.value.due_time,
          late_date: task.value.late_date,
          late_time: task.value.late_time,
        },
      ]);

      if (error) {
        console.error("Error saving task:", error);
        alert("Failed to save task.");
      } else {
        showModal.value = false;
        showSuccessModal.value = true; // Show success modal
        task.value = {
          task_text: "",
          reminder_date: "",
          reminder_time: "",
          due_date: "",
          due_time: "",
          late_date: "",
          late_time: "",
        };
      }
    };

    const redirectToDayframe = () => {
      showSuccessModal.value = false;
      router.push({ name: "Dayframe" }); // Replace 'Dayframe' with your actual route name
    };

    return {
      showModal,
      showSuccessModal,
      errorMessage,
      task,
      toggleModal,
      validateAndSaveTask,
      redirectToDayframe,
    };
  },
});
</script>

<style scoped>
.add-task-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: var(--button-color);
  color: var(--primary-text-color);
  border: none;
  padding: 15px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  width: 50px;
  height: 50px;
}

.task-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: auto;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.modal-row {
  padding: 15px;
}

.top-row {
  background-color: var(--frame1-color);
  color: var(--primary-text-color);
}

.middle-row {
  flex: 1;
  overflow-y: auto;
}

.bottom-row {
  display: flex;
  width: 100%;
  background-color: red;
}

.button-column {
  width: 100%;
  text-align: center;
}

button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 0px;
  background-color: var(--button-color);
  color: var(--primary-text-color);
  font-weight: bold;
  cursor: pointer;
}

button:hover {
  background-color: var(--button-hover-color);
}

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}
</style>
