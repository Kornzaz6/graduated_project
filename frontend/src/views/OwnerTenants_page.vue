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

          </tr>
        </thead>

        <tbody>

          <tr
            v-for="tenant in tenants"
            :key="tenant.id"
            class="border-t hover:bg-gray-50"
          >

            <td class="px-6 py-4">

              <div class="font-medium text-gray-800">
                {{ tenant.user.firstName }} {{ tenant.user.lastName }}
              </div>

              <div class="text-sm text-gray-500">
                {{ tenant.user.username }}
              </div>

            </td>

            <td class="px-6 py-4 text-gray-600">
              {{ tenant.user.email }}
            </td>

            <td class="px-6 py-4 text-gray-700">
              {{ tenant.room.dormitory.name }}
            </td>

            <td class="px-6 py-4 font-medium">
              ห้อง {{ tenant.room.roomNumber }}
            </td>

            <td class="px-6 py-4 text-gray-600">
              {{ formatDate(tenant.startDate) }}
            </td>

            <td class="px-6 py-4 text-gray-600">
              {{ formatDate(tenant.endDate) }}
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
import api from "@/services/api"

const tenants = ref<any[]>([])
const loading = ref(true)

/* ================= FETCH TENANTS ================= */

const fetchTenants = async () => {

  try {

    const { data } = await api.get(
      "/owners/tenants"
    )

    tenants.value = data

  } catch (error) {

    console.error("Fetch tenants error:", error)

  } finally {

    loading.value = false

  }

}

/* ================= FORMAT DATE ================= */

const formatDate = (date:string) => {

  return new Date(date).toLocaleDateString()

}

/* ================= LIFECYCLE ================= */

onMounted(() => {

  fetchTenants()

})

</script>