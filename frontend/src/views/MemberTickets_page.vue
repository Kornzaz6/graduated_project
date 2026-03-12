<template>
  <div class="min-h-screen p-8 bg-gray-50">

    <div class="max-w-6xl mx-auto">

      <!-- HEADER -->

      <div class="flex items-center justify-between mb-8">

        <div>
          <h1 class="text-2xl font-bold">
            Support Tickets
          </h1>

          <p class="text-sm text-gray-500">
            ติดต่อเจ้าของหอเกี่ยวกับปัญหาห้องพัก
          </p>
        </div>

        <button
          @click="createTicket"
          class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + New Ticket
        </button>

      </div>

      <!-- LOADING -->

      <div
        v-if="loading"
        class="p-10 text-center text-gray-500 bg-white shadow rounded-xl"
      >
        Loading tickets...
      </div>

      <!-- EMPTY -->

      <div
        v-else-if="tickets.length === 0"
        class="p-10 text-center text-gray-400 bg-white shadow rounded-xl"
      >
        No tickets yet
      </div>

      <!-- TABLE -->

      <div v-else class="overflow-hidden bg-white shadow rounded-xl">

        <table class="w-full text-sm">

          <thead class="bg-gray-50">
            <tr>
              <th class="th">Room</th>
              <th class="th">Title</th>
              <th class="th">Type</th>
              <th class="th">Status</th>
              <th class="th">Created</th>
              <th class="th">Action</th>
            </tr>
          </thead>

          <tbody>

            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="border-t hover:bg-gray-50"
            >

              <td class="td">
                {{ ticket.contract?.room?.roomNumber }}
              </td>

              <td class="td">
                {{ ticket.title }}
              </td>

              <td class="td">
                {{ ticket.type }}
              </td>

              <td class="td">

                <span
                  class="px-2 py-1 text-xs font-semibold rounded"
                  :class="statusColor(ticket.status)"
                >
                  {{ ticket.status }}
                </span>

              </td>

              <td class="td">
                {{ formatDate(ticket.createdAt) }}
              </td>

              <td class="td">

                <router-link
                  :to="{
                    name: 'TicketChat',
                    params: { ticketId: ticket.id }
                  }"
                  class="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  View
                </router-link>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import api from "@/services/api"

/* ================= STATE ================= */

const tickets = ref<any[]>([])
const loading = ref(true)

const router = useRouter()

/* ================= FETCH ================= */

const fetchTickets = async () => {

  try {

    const res = await api.get(
      "/support/tickets/member"
    )

    tickets.value = res.data

  }

  catch (error) {

    console.error("Fetch tickets error:", error)

  }

  finally {

    loading.value = false

  }

}

/* ================= NAVIGATION ================= */

const createTicket = () => {

  router.push({
    name: "MemberDashboard"
  })

}

/* ================= UTIL ================= */

const formatDate = (date: string) => {

  return new Date(date).toLocaleDateString(
    "th-TH"
  )

}

const statusColor = (status: string) => {

  switch (status) {

    case "OPEN":
      return "bg-yellow-100 text-yellow-800"

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800"

    case "RESOLVED":
      return "bg-green-100 text-green-800"

    case "CLOSED":
      return "bg-gray-100 text-gray-700"

    default:
      return "bg-gray-100 text-gray-700"

  }

}

/* ================= INIT ================= */

onMounted(fetchTickets)

</script>

<style scoped>

.th {
  @apply px-4 py-3 text-left;
}

.td {
  @apply px-4 py-3;
}

</style>