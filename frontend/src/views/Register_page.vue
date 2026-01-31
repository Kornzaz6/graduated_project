<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
      <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">
        Register
      </h2>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Username -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            v-model="form.username"
            type="text"
            required
            placeholder="Enter your username"
            class="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            v-model="form.firstName"
            type="text"
            required
            placeholder="Enter your first name"
            class="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            v-model="form.lastName"
            type="text"
            required
            placeholder="Enter your last name"
            class="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="example@email.com"
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

        <!-- Confirm Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            v-model="form.confirmPassword"
            type="password"
            required
            placeholder="Confirm password"
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
          Register
        </button>
      </form>

      <p class="text-sm text-center mt-4 text-gray-600">
        Already have an account?
        <router-link to="/login" class="text-blue-600 hover:underline">
          Login
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
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const error = ref("");

const handleRegister = async () => {
  error.value = "";

  // ✅ check password match
  if (form.password !== form.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: form.username,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      error.value = data.message || "Registration failed";
      return;
    }

    // ✅ register success → go to login
    router.push("/login");
  } catch (err) {
    error.value = "Cannot connect to server";
  }
};
</script>
