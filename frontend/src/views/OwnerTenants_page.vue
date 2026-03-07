<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <!-- HEADER -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">ผู้เช่าทั้งหมด</h1>

      <p class="text-gray-500">รายชื่อผู้เช่าที่กำลังพักอยู่ในหอของคุณ</p>

      <p class="mt-2 text-sm text-gray-400">มีผู้เช่าทั้งหมด {{ tenants.length }} คน</p>
    </div>

    <div class="flex flex-wrap gap-4 mt-4">
      <!-- SEARCH -->
      <input
        v-model="search"
        type="text"
        placeholder="ค้นหาชื่อผู้เช่า หรือ ห้อง..."
        class="w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      <!-- FILTER -->
      <select v-model="statusFilter" class="px-4 py-2 border rounded-lg">
        <option value="">ทุกสถานะ</option>
        <option value="ACTIVE">กำลังเช่า</option>
        <option value="WAITING_OWNER_APPROVAL">รออนุมัติ</option>
        <option value="EXPIRED">หมดสัญญา</option>
      </select>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>

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
          <tr v-for="tenant in filteredTenants" :key="tenant.id" class="border-t hover:bg-gray-50">
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
            <td class="px-6 py-4 font-medium">ห้อง {{ tenant.room.roomNumber }}</td>

            <!-- START -->
            <td class="px-6 py-4 text-gray-600">
              {{ formatDate(tenant.startDate) }}
            </td>

            <!-- END -->
            <td class="px-6 py-4 text-gray-600">
              {{ formatDate(tenant.endDate) }}
            </td>

            <!-- REMAINING MONTH -->
            <td class="px-6 py-4 text-gray-600">{{ getRemainingMonths(tenant.endDate) }} เดือน</td>

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
                @click="selectedTenant = tenant"
              >
                ดูสัญญา
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- EMPTY -->
      <div v-if="!tenants.length" class="p-10 text-center text-gray-400">ยังไม่มีผู้เช่า</div>
    </div>

    <!-- TENANT MODAL -->
    <div
      v-if="selectedTenant"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40"
    >
      <div class="w-full max-w-lg p-6 bg-white rounded-xl">
        <h2 class="mb-4 text-xl font-bold">ข้อมูลผู้เช่า</h2>

        <div class="space-y-2 text-sm">
          <p>
            <b>ชื่อ:</b>
            {{ selectedTenant.user.firstName }}
            {{ selectedTenant.user.lastName }}
          </p>

          <p>
            <b>Email:</b>
            {{ selectedTenant.user.email }}
          </p>

          <p>
            <b>หอพัก:</b>
            {{ selectedTenant.room.dormitory.name }}
          </p>

          <p>
            <b>ห้อง:</b>
            {{ selectedTenant.room.roomNumber }}
          </p>

          <p>
            <b>เริ่มสัญญา:</b>
            {{ formatDate(selectedTenant.startDate) }}
          </p>

          <p>
            <b>สิ้นสุด:</b>
            {{ formatDate(selectedTenant.endDate) }}
          </p>

          <p>
            <b>สถานะ:</b>
            {{ statusText(selectedTenant.status) }}
          </p>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            class="px-4 py-2 text-white bg-blue-500 rounded"
            @click="viewContract(selectedTenant.id)"
          >
            ดูสัญญา
          </button>

          <button class="px-4 py-2 text-white bg-gray-500 rounded" @click="selectedTenant = null">
            ปิด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const tenants = ref<any[]>([])
const loading = ref(true)

const router = useRouter()

const search = ref('')
const statusFilter = ref('')
const selectedTenant = ref<any | null>(null)

const statusText = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'กำลังเช่า'

    case 'WAITING_OWNER_APPROVAL':
      return 'รออนุมัติ'

    case 'EXPIRED':
      return 'หมดสัญญา'

    default:
      return status
  }
}

/* ================= FETCH TENANTS ================= */

const fetchTenants = async () => {
  try {
    const { data } = await api.get('/owners/tenants')

    tenants.value = data
  } catch (error) {
    console.error('Fetch tenants error:', error)
  } finally {
    loading.value = false
  }
}

/* ================= FORMAT DATE ================= */

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/* ================= REMAINING MONTH ================= */

const getRemainingMonths = (endDate: string) => {
  const end = new Date(endDate)
  const now = new Date()

  const years = end.getFullYear() - now.getFullYear()
  const months = end.getMonth() - now.getMonth()

  const total = years * 12 + months

  return Math.max(0, total)
}

/* ================= STATUS STYLE ================= */

const statusClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700'

    case 'WAITING_OWNER_APPROVAL':
      return 'bg-yellow-100 text-yellow-700'

    case 'EXPIRED':
      return 'bg-gray-200 text-gray-600'

    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/* ================= VIEW CONTRACT ================= */

const viewContract = (contractId: number) => {
  router.push(`/owner/contracts/${contractId}`)
}

const filteredTenants = computed(() => {
  return tenants.value.filter((tenant) => {
    const name = `${tenant.user.firstName} ${tenant.user.lastName}`.toLowerCase()

    const room = tenant.room.roomNumber.toString()

    const matchSearch = name.includes(search.value.toLowerCase()) || room.includes(search.value)

    const matchStatus = !statusFilter.value || tenant.status === statusFilter.value

    return matchSearch && matchStatus
  })
})

/* ================= LIFECYCLE ================= */

onMounted(() => {
  fetchTenants()
})
</script>