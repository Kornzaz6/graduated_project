<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold">
      Manage Rental Requests
    </h1>

    <div class="overflow-hidden bg-white shadow rounded-xl">
      <table class="w-full text-sm text-left border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3">User</th>
            <th class="p-3">Dormitory</th>
            <th class="p-3">Room</th>
            <th class="p-3">Status</th>
            <th class="p-3">Date</th>
            <th class="p-3 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="req in rentalRequests"
            :key="req.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="p-3">
              {{ req.user.username }}
            </td>

            <td class="p-3">
              {{ req.room.dormitory.name }}
            </td>

            <td class="p-3">
              {{ req.room.roomNumber }}
            </td>

            <td class="p-3">
              <span
                class="px-3 py-1 text-xs font-semibold rounded-full"
                :class="statusClass(req.status)"
              >
                {{ req.status }}
              </span>
            </td>

            <td class="p-3">
              {{ formatDate(req.requestDate) }}
            </td>

            <td class="p-3 text-center">
              <div v-if="req.status === 'PENDING'" class="flex justify-center gap-2">
                <button
                  @click="approve(req.id)"
                  class="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700"
                >
                  Approve
                </button>

                <button
                  @click="reject(req.id)"
                  class="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>

              <span v-else class="text-gray-400">—</span>
            </td>
          </tr>

          <tr v-if="rentalRequests.length === 0">
            <td colspan="6" class="p-6 text-center text-gray-500">
              No rental requests found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import api from "@/services/api"

const rentalRequests = ref<any[]>([])
const loading = ref(false)

/* ================= FETCH ================= */
const fetchRequests = async () => {
  try {
    loading.value = true

    const { data } = await api.get("/rental")

    rentalRequests.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Fetch rental requests error:", error)
  } finally {
    loading.value = false
  }
}

/* ================= APPROVE ================= */
const approve = async (id: number) => {
  try {
    await api.patch(`/rental/${id}/approve`)
    await fetchRequests()
  } catch (error) {
    console.error("Approve error:", error)
    alert("Failed to approve request")
  }
}

/* ================= REJECT ================= */
const reject = async (id: number) => {
  try {
    await api.patch(`/rental/${id}/reject`)
    await fetchRequests()
  } catch (error) {
    console.error("Reject error:", error)
    alert("Failed to reject request")
  }
}

/* ================= UTILS ================= */
const statusClass = (status: string) => {
  if (status === "PENDING") return "bg-yellow-100 text-yellow-700"
  if (status === "APPROVED") return "bg-green-100 text-green-700"
  if (status === "REJECTED") return "bg-red-100 text-red-700"
  return ""
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("th-TH")

onMounted(fetchRequests)
</script>