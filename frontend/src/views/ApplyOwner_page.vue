<template>
  <div class="flex items-center justify-center min-h-screen px-6 py-12 bg-gray-100">
    <div class="w-full max-w-2xl bg-white shadow-xl rounded-2xl">

      <!-- Header -->
      <div class="p-8 border-b">
        <h2 class="text-2xl font-bold text-gray-800">
          Dormitory Owner Application
        </h2>
        <p class="mt-2 text-sm text-gray-500">
          Complete all required information. Your application will be reviewed by the admin.
        </p>
      </div>

      <div class="p-8 space-y-8">

        <!-- Personal Information -->
        <div>
          <h3 class="mb-4 text-lg font-semibold text-gray-700">
            Personal Information
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">First Name *</label>
              <input v-model="form.firstName" type="text" class="input" />
            </div>

            <div>
              <label class="label">Last Name *</label>
              <input v-model="form.lastName" type="text" class="input" />
            </div>
          </div>

          <div class="mt-4">
            <label class="label">Email *</label>
            <input v-model="form.email" type="email" class="input" />
          </div>

          <div class="mt-4">
            <label class="label">Phone Number *</label>
            <input v-model="form.phone" type="text" class="input" />
          </div>
        </div>

        <!-- Bank Information -->
        <div>
          <h3 class="mb-4 text-lg font-semibold text-gray-700">
            Bank Information (Optional)
          </h3>

          <div>
            <label class="label">Bank Name</label>
            <input v-model="form.bankName" type="text" class="input" />
          </div>

          <div class="mt-4">
            <label class="label">Bank Account Name</label>
            <input v-model="form.bankAccountName" type="text" class="input" />
          </div>

          <div class="mt-4">
            <label class="label">Bank Account Number</label>
            <input v-model="form.bankAccountNo" type="text" class="input" />
          </div>
        </div>

        <!-- Documents Upload -->
        <div>
          <h3 class="mb-4 text-lg font-semibold text-gray-700">
            Supporting Documents (Optional)
          </h3>

          <div class="space-y-4">

            <div>
              <label class="label">ID Card Image</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFile($event, 'idCardImage')"
                class="input"
              />
              <p v-if="files.idCardImage" class="mt-1 text-xs text-gray-500">
                Selected: {{ files.idCardImage.name }}
              </p>
            </div>

            <div>
              <label class="label">Business License</label>
              <input
                type="file"
                accept="image/*"
                @change="handleFile($event, 'businessLicense')"
                class="input"
              />
              <p v-if="files.businessLicense" class="mt-1 text-xs text-gray-500">
                Selected: {{ files.businessLicense.name }}
              </p>
            </div>

          </div>
        </div>

        <!-- Additional Info -->
        <div>
          <h3 class="mb-4 text-lg font-semibold text-gray-700">
            Additional Information
          </h3>

          <textarea
            v-model="form.message"
            rows="4"
            class="input"
            placeholder="Describe your dormitory, location, number of rooms, facilities..."
          />
        </div>

        <!-- Messages -->
        <div v-if="statusMessage" class="alert-success">
          {{ statusMessage }}
        </div>

        <div v-if="errorMessage" class="alert-error">
          {{ errorMessage }}
        </div>

        <!-- Submit -->
        <button
          @click="submitApplication"
          :disabled="loading || currentUser?.role === 'OWNER'"
          class="w-full py-3 font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? "Submitting..." : "Submit Application" }}
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const loading = ref(false)
const statusMessage = ref("")
const errorMessage = ref("")
const currentUser = ref<any>(null)

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNo: "",
  message: "",
})

const files = reactive<{
  idCardImage: File | null
  businessLicense: File | null
}>({
  idCardImage: null,
  businessLicense: null,
})

onMounted(() => {
  const user = localStorage.getItem("user")
  if (!user) {
    router.push("/login")
    return
  }

  currentUser.value = JSON.parse(user)

  form.firstName = currentUser.value.firstName || ""
  form.lastName = currentUser.value.lastName || ""
  form.email = currentUser.value.email || ""
})

const handleFile = (event: Event, field: "idCardImage" | "businessLicense") => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
  files[field] = input.files[0]
}
}

const submitApplication = async () => {
  errorMessage.value = ""
  statusMessage.value = ""

  if (!form.firstName || !form.lastName || !form.email || !form.phone) {
    errorMessage.value = "Please fill in all required fields."
    return
  }

  try {
    loading.value = true

    const formData = new FormData()

    formData.append("userId", currentUser.value.id)
    formData.append("firstName", form.firstName)
    formData.append("lastName", form.lastName)
    formData.append("email", form.email)
    formData.append("phone", form.phone)
    formData.append("bankName", form.bankName)
    formData.append("bankAccountName", form.bankAccountName)
    formData.append("bankAccountNo", form.bankAccountNo)
    formData.append("message", form.message)

    if (files.idCardImage) {
      formData.append("idCardImage", files.idCardImage)
    }

    if (files.businessLicense) {
      formData.append("businessLicense", files.businessLicense)
    }

    const response = await fetch(
      "http://localhost:5000/api/owners/apply",
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Application failed")
    }

    statusMessage.value = "Application submitted successfully!"
  } catch (error: any) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none;
}

.label {
  @apply block mb-1 text-sm font-medium text-gray-700;
}

.alert-success {
  @apply p-3 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg;
}

.alert-error {
  @apply p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg;
}
</style>