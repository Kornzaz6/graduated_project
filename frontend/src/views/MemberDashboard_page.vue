<template>
  <div>

    <h1 class="mb-6 text-2xl font-bold">
      My Rental Requests
    </h1>

    <div
      v-for="req in requests"
      :key="req.id"
      class="p-4 mb-4 bg-white rounded shadow"
    >

      <p class="font-semibold">
        {{ req.room.dormitory.name }}
      </p>

      <p>Status: {{ req.status }}</p>

      <!-- APPROVED แต่ยังไม่ได้ทำสัญญา -->

      <router-link
        v-if="req.status === 'APPROVED' && !req.leaseContract"
        :to="`/member/contract/${req.id}`"
        class="inline-block px-4 py-2 mt-3 text-white bg-blue-600 rounded"
      >
        ทำสัญญา
      </router-link>

      <!-- ทำสัญญาแล้ว -->

      <p
        v-if="req.leaseContract"
        class="mt-2 text-green-600"
      >
        ทำสัญญาแล้ว
      </p>

      <!-- ✅ CONTACT OWNER -->

      <router-link
        v-if="req.leaseContract"
        :to="{
          name: 'MemberCreateTicket',
          params: { contractId: req.leaseContract.id }
        }"
        class="inline-block px-4 py-2 mt-3 ml-2 text-white bg-indigo-600 rounded hover:bg-indigo-700"
      >
        Contact Owner
      </router-link>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import api from "@/services/api"

const requests = ref<any[]>([])

const currentUser = JSON.parse(
  localStorage.getItem("user") || "null"
)

const fetchRequests = async () => {
  if (!currentUser?.id) return

  try {
    const { data } = await api.get(
      `/rental/member/${currentUser.id}`
    )

    requests.value = Array.isArray(data) ? data : []

  } catch (error) {
    console.error("Fetch member requests error:", error)
  }
}

onMounted(fetchRequests)
</script>