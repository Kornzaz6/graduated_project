<template>
  <div class="min-h-screen p-8 bg-gray-100">

    <div class="max-w-4xl mx-auto">

      <h1 class="mb-8 text-3xl font-bold">
        Manage Profile
      </h1>

      <!-- PROFILE CARD -->
      <div class="p-8 bg-white shadow rounded-2xl">

        <!-- USER HEADER -->
        <div class="flex items-center gap-6 mb-8">

          <div
            class="flex items-center justify-center w-20 h-20 text-2xl font-bold text-white bg-blue-600 rounded-full"
          >
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

        <!-- SUCCESS -->
        <div
          v-if="successMessage"
          class="p-3 mb-4 text-green-700 bg-green-100 rounded-lg"
        >
          {{ successMessage }}
        </div>

        <!-- ERROR -->
        <div
          v-if="errorMessage"
          class="p-3 mb-4 text-red-700 bg-red-100 rounded-lg"
        >
          {{ errorMessage }}
        </div>

        <!-- FORM -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div>
            <label class="label">First Name</label>
            <input
              v-model="form.firstName"
              class="input"
              placeholder="First name"
            />
          </div>

          <div>
            <label class="label">Last Name</label>
            <input
              v-model="form.lastName"
              class="input"
              placeholder="Last name"
            />
          </div>

          <div class="md:col-span-2">
            <label class="label">Email</label>
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

      <!-- PASSWORD -->
      <div class="p-8 mt-8 bg-white shadow rounded-2xl">

        <h2 class="mb-6 text-xl font-semibold">
          Change Password
        </h2>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div class="relative">
            <label class="label">New Password</label>

            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="passwordForm.password"
              class="input"
              placeholder="New password"
            />

            <button
              type="button"
              class="absolute text-sm text-blue-600 right-3 top-9"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "Hide" : "Show" }}
            </button>
          </div>

          <div>
            <label class="label">Confirm Password</label>
            <input
              type="password"
              v-model="passwordForm.confirmPassword"
              class="input"
              placeholder="Confirm password"
            />
          </div>

        </div>

        <!-- PASSWORD STRENGTH -->
        <div
          v-if="passwordForm.password"
          class="mt-3 text-sm"
          :class="passwordStrengthColor"
        >
          Password strength: {{ passwordStrength }}
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
import { ref, reactive, onMounted, computed } from "vue"
import api from "@/services/api"

const user = ref<any>(null)
const loading = ref(false)

const successMessage = ref("")
const errorMessage = ref("")

const showPassword = ref(false)

const form = reactive({
  firstName: "",
  lastName: "",
  email: ""
})

const passwordForm = reactive({
  password: "",
  confirmPassword: ""
})

/* ================= LOAD USER ================= */

onMounted(() => {

  const localUser = localStorage.getItem("user")

  if (localUser) {

    user.value = JSON.parse(localUser)

    form.firstName = user.value.firstName || ""
    form.lastName = user.value.lastName || ""
    form.email = user.value.email || ""

  }

})

/* ================= UPDATE PROFILE ================= */

const updateProfile = async () => {

  if (!user.value?.id) return

  try {

    successMessage.value = ""
    errorMessage.value = ""

    loading.value = true

    const { data } = await api.patch(
      `/users/${user.value.id}`,
      form
    )

    user.value = data

    localStorage.setItem("user", JSON.stringify(data))

    successMessage.value = "Profile updated successfully"

  }

  catch (err: any) {

    console.error(err)

    errorMessage.value =
      err?.response?.data?.message ||
      "Update failed"

  }

  finally {

    loading.value = false

  }

}

/* ================= RESET ================= */

const resetForm = () => {

  if (!user.value) return

  form.firstName = user.value.firstName
  form.lastName = user.value.lastName
  form.email = user.value.email

}

/* ================= PASSWORD STRENGTH ================= */

const passwordStrength = computed(() => {

  const p = passwordForm.password

  if (p.length < 6) return "Weak"
  if (p.length < 10) return "Medium"
  return "Strong"

})

const passwordStrengthColor = computed(() => {

  if (passwordStrength.value === "Weak") return "text-red-500"
  if (passwordStrength.value === "Medium") return "text-yellow-500"

  return "text-green-600"

})

/* ================= CHANGE PASSWORD ================= */

const changePassword = async () => {

  if (!user.value?.id) return

  if (!passwordForm.password) {
    errorMessage.value = "Password cannot be empty"
    return
  }

  if (passwordForm.password !== passwordForm.confirmPassword) {

    errorMessage.value = "Passwords do not match"
    return

  }

  try {

    successMessage.value = ""
    errorMessage.value = ""

    await api.patch(
      `/users/change-password/${user.value.id}`,
      { password: passwordForm.password }
    )

    passwordForm.password = ""
    passwordForm.confirmPassword = ""

    successMessage.value = "Password updated successfully"

  }

  catch (err: any) {

    console.error(err)

    errorMessage.value =
      err?.response?.data?.message ||
      "Failed to update password"

  }

}
</script>

<style scoped>

.input {
  @apply w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.label {
  @apply block mb-1 text-sm text-gray-600;
}

</style>