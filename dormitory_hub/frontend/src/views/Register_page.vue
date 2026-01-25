<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">
          Register
        </h2>
  
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              v-model="form.firstName"
              type="text"
              required
              class="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              v-model="form.lastName"
              type="text"
              required
              class="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              class="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              v-model="form.password"
              type="password"
              required
              class="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <p v-if="error" class="text-red-500 text-sm">
            {{ error }}
          </p>
  
          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>
  
        <p class="text-sm text-center mt-4 text-gray-600">
          Already have an account?
          <!-- ยังไม่ทำ login -->
          <span class="text-gray-400">(Login page coming soon)</span>
        </p>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, ref } from "vue";
  import { useRouter } from "vue-router";
  
  const router = useRouter();
  
  const form = reactive({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  
  const error = ref<string>("");
  
  const handleRegister = async () => {
    error.value = "";
  
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        error.value = data.message || "Registration failed";
        return;
      }
  
      // ชั่วคราว: กลับหน้า home
      router.push("/");
    } catch {
      error.value = "Cannot connect to server";
    }
  };
  </script>
  