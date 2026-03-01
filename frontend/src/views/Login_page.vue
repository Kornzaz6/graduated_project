<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">

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

        <!-- Error -->
        <p v-if="error" class="text-sm text-red-500">
          {{ error }}
        </p>

        <!-- Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>

      </form>

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
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const form = reactive({
  identifier: "",
  password: "",
})

const error = ref("")
const loading = ref(false)

const handleLogin = async () => {
  error.value = ""
  loading.value = true

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.message || "Login failed"
      return
    }

    /* ================= SAVE TOKEN ================= */

    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    /* ================= REDIRECT BY ROLE ================= */

    const role = data.user.role

    if (role === "ADMIN") {
      router.push("/admin/dashboard")
    } 
    else if (role === "OWNER") {
      router.push("/owner/dashboard")
    } 
    else if (role === "MEMBER") {
      router.push("/member/home")
    } 
    else {
      router.push("/")
    }

  } catch (err) {
    error.value = "Cannot connect to server"
  } finally {
    loading.value = false
  }
}
</script>