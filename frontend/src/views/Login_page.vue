<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <!-- Title -->
      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">
        Login
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Email or Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Email or Username
          </label>
          <input
            v-model="form.identifier"
            type="text"
            required
            placeholder="Enter email or username"
            class="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="Enter password"
            class="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Error Message -->
        <p v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </p>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>

      <!-- Register Link -->
      <p class="text-sm text-center mt-4 text-gray-600">
        Don't have an account?
        <router-link to="/register" class="text-blue-600 hover:underline">
          Register
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const form = reactive({
  identifier: "",
  password: "",
});

const error = ref("");

const handleLogin = async () => {
  error.value = "";

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.message || "Login failed";
      return;
    }

    // Login success
    // (ตอนนี้ยังไม่ใช้ JWT → แค่ redirect)
    router.push("/dashboard");
  } catch (err) {
    error.value = "Cannot connect to server";
  }
};
</script>
