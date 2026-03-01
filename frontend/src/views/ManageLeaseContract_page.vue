<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">Manage Lease Contracts</h1>

    <div class="overflow-hidden bg-white shadow rounded-xl">
      <table class="w-full text-sm">
        <thead class="text-gray-600 bg-gray-100">
          <tr>
            <th class="p-4">Tenant</th>
            <th class="p-4">Dormitory</th>
            <th class="p-4">Room</th>
            <th class="p-4">Period</th>
            <th class="p-4">Rent</th>
            <th class="p-4">Status</th>
            <th class="p-4">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="p-6 text-center text-gray-500">Loading contracts...</td>
          </tr>

          <tr v-if="error">
            <td colspan="7" class="p-6 text-center text-red-500">
              {{ error }}
            </td>
          </tr>
          <tr v-for="contract in contracts" :key="contract.id" class="border-t hover:bg-gray-50">
            <td class="p-4">{{ contract.user.firstName }} {{ contract.user.lastName }}</td>

            <td class="p-4">
              {{ contract.room.dormitory.name }}
            </td>

            <td class="p-4">
              {{ contract.room.roomNumber }}
            </td>

            <td class="p-4">
              {{ formatDate(contract.startDate) }}
              -
              {{ formatDate(contract.endDate) }}
            </td>

            <td class="p-4">฿{{ contract.monthlyRent }}</td>

            <td class="p-4">
              <span class="px-3 py-1 text-xs rounded-full" :class="statusClass(contract.status)">
                {{ contract.status }}
              </span>
            </td>

            <td class="p-4 space-x-2">
              <!-- อนุมัติ -->
              <button
              v-if="contract.status === 'WAITING_OWNER_APPROVAL'"
                @click="approveContract(contract.id)"
                class="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700"
              >
                Approve
              </button>

              <!-- ยกเลิก -->
              <button
                v-if="contract.status === 'ACTIVE'"
                @click="terminateContract(contract.id)"
                class="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Terminate
              </button>
            </td>
          </tr>

          <tr v-if="contracts.length === 0">
            <td colspan="7" class="p-6 text-center text-gray-500">No contracts found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const contracts = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const backendURL = "http://localhost:5000"

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

/* ================= FETCH CONTRACTS ================= */
const fetchContracts = async () => {
  if (!currentUser?.id) {
    error.value = 'User not found'
    loading.value = false
    return
  }

  try {
    loading.value = true

    const res = await axios.get(
      `${backendURL}/api/lease/owner/${currentUser.id}`
    )

    contracts.value = res.data

  } catch (err) {
    console.error('Fetch owner contracts error:', err)
    error.value = 'Failed to load contracts'
  } finally {
    loading.value = false
  }
}

/* ================= APPROVE CONTRACT ================= */
const approveContract = async (id: number) => {
  try {
    await axios.patch(
      `${backendURL}/api/rental/contracts/${id}/approve`
    )

    alert("Contract approved successfully")

    fetchContracts()

  } catch (error) {
    console.error('Approve error:', error)
    alert("Failed to approve contract")
  }
}

/* ================= TERMINATE CONTRACT ================= */
const terminateContract = async (id: number) => {
  try {
    await axios.patch(
      `${backendURL}/api/rental/contracts/${id}/terminate`
    )

    alert("Contract terminated")

    fetchContracts()

  } catch (error) {
    console.error('Terminate error:', error)
    alert("Failed to terminate contract")
  }
}

/* ================= UTIL ================= */
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('th-TH')
}

const statusClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700'
    case 'WAITING_OWNER_APPROVAL':
      return 'bg-yellow-100 text-yellow-700'
    case 'TERMINATED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

onMounted(fetchContracts)
</script>
