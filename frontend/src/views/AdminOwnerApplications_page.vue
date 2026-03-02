<template>
  <div class="min-h-screen p-8 bg-gray-100">

    <div class="max-w-6xl p-8 mx-auto bg-white shadow-xl rounded-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">
          Owner Applications
        </h2>

        <select
          v-model="filterStatus"
          class="px-3 py-2 border rounded-lg"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-10 text-center text-gray-500">
        Loading applications...
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto rounded-xl">
        <table class="min-w-full text-sm">
          <thead class="text-gray-600 bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left">User</th>
              <th class="px-6 py-3 text-left">Phone</th>
              <th class="px-6 py-3 text-left">Message</th>
              <th class="px-6 py-3 text-left">Date</th>
              <th class="px-6 py-3 text-left">Status</th>
              <th class="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="app in filteredApplications"
              :key="app.id"
              class="border-t hover:bg-gray-50"
            >
              <!-- User -->
              <td class="px-6 py-4">
                <div class="font-medium">
                  {{ app.user.username }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ app.user.email }}
                </div>
              </td>

              <!-- Phone -->
              <td class="px-6 py-4">
                {{ app.phone }}
              </td>

              <!-- Message -->
              <td class="px-6 py-4 text-gray-600">
                {{ app.message || "-" }}
              </td>

              <!-- Date -->
              <td class="px-6 py-4 text-gray-500">
                {{ formatDate(app.createdAt) }}
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                  :class="statusClass(app.status)"
                >
                  {{ app.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 space-x-2">

                <template v-if="app.status === 'PENDING'">
                  <button
                    @click="confirmApprove(app.id)"
                    class="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    @click="confirmReject(app.id)"
                    class="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </template>

                <span
                  v-else
                  class="text-xs text-gray-400"
                >
                  No actions
                </span>

              </td>
            </tr>

            <tr v-if="filteredApplications.length === 0">
              <td colspan="6" class="py-10 text-center text-gray-400">
                No applications found
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <!-- Toast -->
      <div
        v-if="toast"
        class="fixed px-6 py-3 text-white bg-black rounded-lg shadow-lg bottom-6 right-6"
      >
        {{ toast }}
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import api from "@/services/api"

/* ================= STATE ================= */
const applications = ref<any[]>([])
const loading = ref(true)
const filterStatus = ref("")
const toast = ref("")

/* ================= FETCH ================= */
const fetchApplications = async () => {
  try {
    loading.value = true

    const { data } = await api.get("/owners/applications")

    applications.value = Array.isArray(data) ? data : []

  } catch (error) {
    console.error("Fetch error:", error)
  } finally {
    loading.value = false
  }
}

/* ================= APPROVE ================= */
const approve = async (id: number) => {
  try {
    await api.patch(`/owners/applications/${id}/approve`)
    toastMessage("Application approved")
    await fetchApplications()
  } catch (err) {
    console.error("Approve error:", err)
  }
}

/* ================= REJECT ================= */
const reject = async (id: number) => {
  try {
    await api.patch(`/owners/applications/${id}/reject`)
    toastMessage("Application rejected")
    await fetchApplications()
  } catch (err) {
    console.error("Reject error:", err)
  }
}

/* ================= CONFIRM ================= */
const confirmApprove = (id: number) => {
  if (confirm("Approve this application?")) {
    approve(id)
  }
}

const confirmReject = (id: number) => {
  if (confirm("Reject this application?")) {
    reject(id)
  }
}

/* ================= FILTER ================= */
const filteredApplications = computed(() => {
  if (!filterStatus.value) return applications.value

  return applications.value.filter(
    (app) => app.status === filterStatus.value
  )
})

/* ================= UTILS ================= */
const statusClass = (status: string) => {
  if (status === "PENDING")
    return "bg-yellow-100 text-yellow-700"

  if (status === "APPROVED")
    return "bg-green-100 text-green-700"

  if (status === "REJECTED")
    return "bg-red-100 text-red-700"

  return ""
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString()

const toastMessage = (message: string) => {
  toast.value = message
  setTimeout(() => {
    toast.value = ""
  }, 3000)
}

/* ================= MOUNT ================= */
onMounted(fetchApplications)
</script>