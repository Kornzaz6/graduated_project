<template>
  <div class="flex items-center justify-center min-h-screen p-6 bg-gray-100">
    <div class="w-full max-w-md p-6 space-y-4 bg-white rounded shadow">

      <h2 class="text-xl font-bold text-gray-800">
        Apply to Become Dormitory Owner
      </h2>

      <p class="text-sm text-gray-500">
        Submit your request. Admin will review and approve your application.
      </p>

      <!-- Phone -->
      <input
        v-model="form.phone"
        type="text"
        placeholder="Phone Number"
        class="w-full p-2 border rounded"
      />

      <!-- Message -->
      <textarea
        v-model="form.message"
        placeholder="Tell us about your dormitory..."
        class="w-full p-2 border rounded"
        rows="4"
      />

      <!-- Status message -->
      <div v-if="statusMessage" class="text-sm text-blue-600">
        {{ statusMessage }}
      </div>

      <!-- Error message -->
      <div v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <!-- Submit -->
      <button
        @click="submitApplication"
        :disabled="loading"
        class="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? "Submitting..." : "Submit Application" }}
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";

const loading = ref(false);
const statusMessage = ref("");
const errorMessage = ref("");

// 🔥 Replace with logged-in user later
const userId = 1;

const form = reactive({
  phone: "",
  message: "",
});

const submitApplication = async () => {
  errorMessage.value = "";
  statusMessage.value = "";

  if (!form.phone) {
    errorMessage.value = "Phone number is required";
    return;
  }

  try {
    loading.value = true;

    const response = await fetch("http://localhost:5000/api/owners/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        phone: form.phone,
        message: form.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Application failed");
    }

    statusMessage.value = "Application submitted successfully!";
    form.phone = "";
    form.message = "";

  } catch (error: any) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};
</script>
