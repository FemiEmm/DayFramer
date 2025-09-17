<template>
    <div class="auth-container">
      <h1>Reset Password</h1>
      <form @submit.prevent="resetPassword">
        <!-- Input for OTP -->
        <input 
          v-model="otp" 
          type="text" 
          placeholder="Enter OTP" 
          required 
        />
        <!-- Input for New Password -->
        <input 
          v-model="newPassword" 
          type="password" 
          placeholder="Enter new password" 
          required 
        />
        <button type="submit">Reset Password</button>
        <!-- Error Message -->
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <!-- Success Message -->
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
      </form>
    </div>
  </template>
  
  <script>
  import { supabase } from "@/lib/supabase";
  
  export default {
    name: "ResetPassword",
    data() {
      return {
        otp: "", // OTP entered by the user
        newPassword: "", // New password
        email: "", // User's email from query parameters
        errorMessage: "", // For displaying errors
        successMessage: "", // For displaying success
      };
    },
    mounted() {
      // Extract email from query parameters
      const urlParams = new URLSearchParams(window.location.search);
      this.email = urlParams.get("email");
      if (!this.email) {
        this.errorMessage = "Missing email address in the reset flow.";
        console.error(this.errorMessage);
      }
    },
    methods: {
      async resetPassword() {
        try {
          // Verify the OTP
          const { error: otpError } = await supabase.auth.verifyOtp({
            email: this.email, // User's email
            token: this.otp,   // OTP entered by the user
            type: "recovery",  // OTP type
          });
  
          if (otpError) {
            this.errorMessage = `Invalid OTP: ${otpError.message}`;
            console.error(this.errorMessage);
            return;
          }
  
          // Update the password
          const { error: passwordError } = await supabase.auth.updateUser({
            email: this.email, // Email is required to identify the user
            password: this.newPassword, // New password
          });
  
          if (passwordError) {
            this.errorMessage = `Error updating password: ${passwordError.message}`;
            console.error(this.errorMessage);
          } else {
            this.successMessage = "Password reset successful! Redirecting to Sign In...";
            setTimeout(() => {
              this.$router.push("/sign-in");
            }, 2000); // Redirect to sign-in after a delay
          }
        } catch (error) {
          this.errorMessage = `Unexpected error: ${error.message}`;
          console.error(this.errorMessage);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .auth-container {
    max-width: 400px;
    margin: auto;
    text-align: center;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  input {
    display: block;
    width: 100%;
    margin: 10px 0;
    padding: 8px;
  }
  
  button {
    padding: 10px 15px;
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
  