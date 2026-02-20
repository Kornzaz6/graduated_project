<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <!-- Title -->
      <h2 class="mb-6 text-2xl font-bold text-center text-gray-800">
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
            class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Error Message -->
        <p v-if="error" class="text-sm text-red-500">
          {{ error }}
        </p>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Login
        </button>
      </form>

      <!-- Register Link -->
      <p class="mt-4 text-sm text-center text-gray-600">
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

    // ✅ เก็บ user ลง localStorage
    localStorage.setItem("user", JSON.stringify(data.user));

    // ✅ redirect
    router.push(data.user.role === "OWNER" ? "/owner/dashboard" : "/dashboard");

  } catch (err) {
    error.value = "Cannot connect to server";
  }
};

</script>
