<template>
  <div class="min-h-screen p-8 bg-gray-50">

    <div class="max-w-2xl p-8 mx-auto bg-white shadow-xl rounded-2xl">

      <!-- HEADER -->

      <h1 class="mb-2 text-2xl font-bold">
        Contact Owner
      </h1>

      <p class="mb-8 text-sm text-gray-500">
        Send a message to the dormitory owner regarding your room.
      </p>

      <!-- FORM -->

      <div class="space-y-6">

        <!-- TITLE -->

        <div>
          <label class="block mb-1 text-sm font-medium">
            Title
          </label>

          <input
            v-model="title"
            type="text"
            placeholder="Example: Air conditioner broken"
            class="input"
          />
        </div>

        <!-- TYPE -->

        <div>
          <label class="block mb-1 text-sm font-medium">
            Issue Type
          </label>

          <select v-model="type" class="input">

            <option value="GENERAL">General</option>

            <option value="MAINTENANCE">
              Maintenance
            </option>

            <option value="PAYMENT">
              Payment
            </option>

            <option value="COMPLAINT">
              Complaint
            </option>

          </select>
        </div>

        <!-- MESSAGE -->

        <div>
          <label class="block mb-1 text-sm font-medium">
            Message
          </label>

          <textarea
            v-model="message"
            rows="5"
            placeholder="Describe your problem..."
            class="input"
          />
        </div>

        <!-- ACTIONS -->

        <div class="flex justify-end gap-3">

          <button
            @click="goBack"
            class="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            @click="createTicket"
            :disabled="loading"
            class="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? "Sending..." : "Send Message" }}
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">

import { ref } from "vue"
import { useRouter, useRoute } from "vue-router"
import api from "@/services/api"

const router = useRouter()
const route = useRoute()

/* ================= STATE ================= */

const title = ref("")
const message = ref("")
const type = ref("GENERAL")

const loading = ref(false)

/* ================= CONTRACT ================= */

const contractId = Number(route.params.contractId)

/* ================= CREATE TICKET ================= */

const createTicket = async () => {

  if (!title.value || !message.value) {

    alert("Please fill all fields")

    return

  }

  try {

    loading.value = true

    await api.post("/support/tickets", {

      contractId,
      title: title.value,
      message: message.value,
      type: type.value

    })

    alert("Ticket sent successfully")

    router.push({
      name: "MemberTickets"
    })

  }

  catch (error:any) {

    console.error(error)

    alert(
      error.response?.data?.message ||
      "Failed to create ticket"
    )

  }

  finally {

    loading.value = false

  }

}

/* ================= NAVIGATION ================= */

const goBack = () => {

  router.back()

}

</script>

<style scoped>

.input {
  @apply w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

</style>