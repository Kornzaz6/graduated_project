<template>
  <div class="min-h-screen p-8 bg-gray-100">

    <div class="max-w-3xl mx-auto">

      <h1 class="mb-8 text-3xl font-bold">
        Manage Profile
      </h1>

      <!-- PROFILE CARD -->
      <div class="p-8 bg-white shadow rounded-2xl">

        <div class="flex items-center gap-6 mb-8">
          <div class="flex items-center justify-center w-20 h-20 text-2xl font-bold text-white bg-blue-600 rounded-full">
            {{ user?.firstName?.charAt(0) }}
          </div>

          <div>
            <div class="text-lg font-semibold">
              {{ user?.firstName }} {{ user?.lastName }}
            </div>
            <div class="text-sm text-gray-500">
              {{ user?.email }}
            </div>
          </div>
        </div>

        <!-- FORM -->
        <div class="space-y-6">

          <!-- First Name -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600">
              First Name
            </label>
            <input
              v-model="form.firstName"
              class="input"
              placeholder="Your first name"
            />
          </div>

          <!-- Last Name -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600">
              Last Name
            </label>
            <input
              v-model="form.lastName"
              class="input"
              placeholder="Your last name"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="example@email.com"
            />
          </div>

        </div>

        <!-- ACTIONS -->
        <div class="flex justify-end gap-4 mt-8">

          <button
            @click="resetForm"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Reset
          </button>

          <button
            @click="updateProfile"
            :disabled="loading"
            class="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? "Saving..." : "Save Changes" }}
          </button>

        </div>

      </div>

      <!-- CHANGE PASSWORD -->
      <div class="p-8 mt-8 bg-white shadow rounded-2xl">

        <h2 class="mb-6 text-xl font-semibold">
          Change Password
        </h2>

        <div class="space-y-4">

          <div>
            <label class="block mb-1 text-sm text-gray-600">
              New Password
            </label>
            <input
              v-model="passwordForm.password"
              type="password"
              class="input"
              placeholder="New password"
            />
          </div>

          <div>
            <label class="block mb-1 text-sm text-gray-600">
              Confirm Password
            </label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="input"
              placeholder="Confirm password"
            />
          </div>

        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="changePassword"
            class="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Update Password
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import api from "@/services/api"

const user = ref<any>(null)
const loading = ref(false)

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
})

const passwordForm = reactive({
  password: "",
  confirmPassword: "",
})

/* =========================================
   LOAD USER
========================================= */
onMounted(() => {
  const localUser = localStorage.getItem("user")

  if (localUser) {
    user.value = JSON.parse(localUser)

    form.firstName = user.value?.firstName || ""
    form.lastName = user.value?.lastName || ""
    form.email = user.value?.email || ""
  }
})

/* =========================================
   UPDATE PROFILE
========================================= */
const updateProfile = async () => {
  if (!user.value?.id) return

  try {
    loading.value = true

    const { data } = await api.patch(
      `/users/${user.value.id}`,
      form
    )

    user.value = data

    localStorage.setItem("user", JSON.stringify(data))

    alert("Profile updated successfully")
  } catch (err: any) {
    console.error(err)
    alert(
      err?.response?.data?.message ||
      "Update failed"
    )
  } finally {
    loading.value = false
  }
}

/* =========================================
   RESET FORM
========================================= */
const resetForm = () => {
  if (!user.value) return

  form.firstName = user.value.firstName
  form.lastName = user.value.lastName
  form.email = user.value.email
}

/* =========================================
   CHANGE PASSWORD
========================================= */
const changePassword = async () => {
  if (!user.value?.id) return

  if (passwordForm.password !== passwordForm.confirmPassword) {
    alert("Passwords do not match")
    return
  }

  try {
    await api.patch(
      `/users/change-password/${user.value.id}`,
      { password: passwordForm.password }
    )

    passwordForm.password = ""
    passwordForm.confirmPassword = ""

    alert("Password updated successfully")
  } catch (err: any) {
    console.error(err)
    alert(
      err?.response?.data?.message ||
      "Failed to update password"
    )
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>