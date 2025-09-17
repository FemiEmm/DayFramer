<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>Update Profile</h3>
        <form @submit.prevent="updateProfile">
          <!-- Email Field -->
          <div>
            <label>Email</label>
            <input v-model="email" type="email" placeholder="Email" required />
          </div>
          <!-- Display Name Field -->
          <div>
            <label>Display Name</label>
            <input v-model="displayName" type="text" placeholder="Display Name" />
          </div>
          <!-- Phone Number Field -->
          <div>
            <label>Phone Number</label>
            <input v-model="phone" type="tel" placeholder="000 000 000 0000" />
          </div>
          <!-- Submit Button -->
          <button type="submit">Update Profile</button>
        </form>
        <button @click="closeModal" class="close-button">Close</button>
        <!-- Feedback Messages -->
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
      </div>
    </div>
  </template>
  
  <script>
  import { supabase } from "@/lib/supabase";
  
  export default {
    name: "UpdateProfileModal",
    data() {
      return {
        email: "",
        displayName: "",
        phone: "",
        errorMessage: "",
        successMessage: "",
      };
    },
    mounted() {
      this.loadUserData();
    },
    methods: {
      async loadUserData() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          this.errorMessage = `Failed to load user data: ${error.message}`;
          return;
        }
        this.email = user.email || "";
        this.displayName = user.user_metadata?.name || "";
        this.phone = user.user_metadata?.phone || "";
      },
      async updateProfile() {
        this.errorMessage = "";
        this.successMessage = "";
  
        const updates = {
          email: this.email,
          data: {
            name: this.displayName,
            phone: this.phone,
          },
        };
  
        const { error } = await supabase.auth.updateUser(updates);
        if (error) {
          this.errorMessage = `Error updating profile: ${error.message}`;
        } else {
          this.successMessage = "Profile updated successfully!";
        }
      },
      closeModal() {
        this.$emit("close");
      },
    },
  };
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
    padding: 2px;
    border-radius: 8px;
    width: 300px;
    text-align: center;
    width: 500px;
  }

  h3{
    background-color: var(--frame1-color);
  }
  
  form > div {
    margin: 10px 0;
  }
  
  input {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
  }
  
  button {
    padding: 10px 15px;
    margin-top: 10px;
  }
  
  .error {
    color: red;
    margin-top: 10px;
  }
  
  .success {
    color: green;
    margin-top: 10px;
  }
  </style>
  