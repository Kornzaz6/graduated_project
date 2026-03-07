<template>
  <div class="min-h-screen p-6 bg-gray-100">

    <!-- HEADER -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">
        ผู้เช่าทั้งหมด
      </h1>

      <p class="text-gray-500">
        รายชื่อผู้เช่าที่กำลังพักอยู่ในหอของคุณ
      </p>

      <p class="mt-2 text-sm text-gray-400">
        มีผู้เช่าทั้งหมด {{ tenants.length }} คน
      </p>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="p-10 text-center text-gray-500">
      กำลังโหลดข้อมูล...
    </div>

    <!-- TABLE -->
    <div v-else class="overflow-hidden bg-white shadow rounded-xl">

      <table class="w-full">

        <thead class="bg-gray-50">
          <tr class="text-sm text-gray-600">

            <th class="px-6 py-3 text-left">ผู้เช่า</th>
            <th class="px-6 py-3 text-left">Email</th>
            <th class="px-6 py-3 text-left">หอพัก</th>
            <th class="px-6 py-3 text-left">ห้อง</th>
            <th class="px-6 py-3 text-left">เริ่มสัญญา</th>
            <th class="px-6 py-3 text-left">สิ้นสุด</th>
            <th class="px-6 py-3 text-left">เหลือ</th>
            <th class="px-6 py-3 text-left">สถานะ</th>
            <th class="px-6 py-3 text-left">จัดการ</th>

          </tr>
        </thead>

        <tbody>

          <tr
            v-for="tenant in tenants"
            :key="tenant.id"
            class="border-t hover:bg-gray-50"
          >

            <!-- TENANT -->
            <td class="px-6 py-4">

              <div class="font-medium text-gray-800">
                {{ tenant.user.firstName }} {{ tenant.user.lastName }}
              </div>

              <div class="text-sm text-gray-500">
                {{ tenant.user.username }}
              </div>

            </td>

            <!-- EMAIL -->
            <td class="px-6 py-4 text-gray-600">
              {{ tenant.user.email }}
            </td>

            <!-- DORM -->
            <td class="px-6 py-4 text-gray-700">
              {{ tenant.room.dormitory.name }}
            </td>

            <!-- ROOM -->
            <td class="px-6 py-4 font-medium">
              ห้อง {{ tenant.room.roomNumber }}
            </td>

            <!-- START -->
            <td class="px-6 py-4 text-gray-600">
              {{ formatDate(tenant.startDate) }}
            </td>

            <!-- END -->
            <td class="px-6 py-4 text-gray-600">
              {{ formatDate(tenant.endDate) }}
            </td>

            <!-- REMAINING MONTH -->
            <td class="px-6 py-4 text-gray-600">
              {{ getRemainingMonths(tenant.endDate) }} เดือน
            </td>

            <!-- STATUS -->
            <td class="px-6 py-4">

              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="statusClass(tenant.status)"
              >
                {{ tenant.status }}
              </span>

            </td>

            <!-- ACTION -->
            <td class="px-6 py-4">

              <button
                class="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                @click="viewContract(tenant.id)"
              >
                ดูสัญญา
              </button>

            </td>

          </tr>

        </tbody>

      </table>

      <!-- EMPTY -->
      <div
        v-if="!tenants.length"
        class="p-10 text-center text-gray-400"
      >
        ยังไม่มีผู้เช่า
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import api from "@/services/api"

const tenants = ref<any[]>([])
const loading = ref(true)

const router = useRouter()

/* ================= FETCH TENANTS ================= */

const fetchTenants = async () => {

  try {

    const { data } = await api.get("/owners/tenants")

    tenants.value = data

  } catch (error) {

    console.error("Fetch tenants error:", error)

  } finally {

    loading.value = false

  }

}

/* ================= FORMAT DATE ================= */

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

/* ================= REMAINING MONTH ================= */

const getRemainingMonths = (endDate: string) => {

  const end = new Date(endDate)
  const now = new Date()

  const diff = end.getTime() - now.getTime()

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)))

}

/* ================= STATUS STYLE ================= */

const statusClass = (status: string) => {

  switch (status) {

    case "ACTIVE":
      return "bg-green-100 text-green-700"

    case "WAITING_OWNER_APPROVAL":
      return "bg-yellow-100 text-yellow-700"

    case "EXPIRED":
      return "bg-gray-200 text-gray-600"

    default:
      return "bg-gray-100 text-gray-600"

  }

}

/* ================= VIEW CONTRACT ================= */

const viewContract = (contractId: number) => {

  router.push(`/owner/contracts/${contractId}`)

}

/* ================= LIFECYCLE ================= */

onMounted(() => {

  fetchTenants()

})

</script>