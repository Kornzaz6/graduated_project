<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h2 class="mb-6 text-2xl font-bold text-center text-gray-800">
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
            class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            class="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          Register
        </button>
      </form>

      <p class="mt-4 text-sm text-center text-gray-600">
        Already have an account?
        <router-link to="/login" class="text-blue-600 hover:underline">
          Login
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import api from "@/services/api"

const router = useRouter()

const form = reactive({
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
})

const error = ref("")
const loading = ref(false)

const handleRegister = async () => {
  error.value = ""

  // ✅ check password match
  if (form.password !== form.confirmPassword) {
    error.value = "Passwords do not match"
    return
  }

  try {
    loading.value = true

    await api.post("/auth/register", {
      username: form.username,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    })

    // ✅ register success → go to login
    router.push("/login")

  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      "Registration failed or server unavailable"
  } finally {
    loading.value = false
  }
}
</script>