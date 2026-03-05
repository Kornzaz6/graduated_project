<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <div class="p-8 mx-auto bg-white shadow-xl max-w-7xl rounded-2xl">

      <h1 class="mb-8 text-2xl font-bold">
        Payment Management
      </h1>

      <!-- ================= CREATE PAYMENT ================= -->
      <div class="p-6 mb-10 bg-gray-50 rounded-xl">
        <h2 class="mb-4 text-lg font-semibold">Create Monthly Bill</h2>

        <div class="grid grid-cols-4 gap-4">

          <!-- SELECT CONTRACT -->
          <select v-model="selectedContractId" class="input">
            <option disabled value="">Select Contract</option>
            <option
              v-for="contract in contracts"
              :key="contract.id"
              :value="contract.id"
            >
              Room {{ contract.room.roomNumber }} -
              {{ contract.user.firstName }}
            </option>
          </select>

          <input
            v-model="newPayment.amount"
            type="number"
            placeholder="Amount"
            class="input"
          />

          <input
            v-model="newPayment.dueDate"
            type="date"
            class="input"
          />

          <button
            @click="createPayment"
            :disabled="creating"
            class="text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ creating ? "Creating..." : "Create" }}
          </button>

        </div>
      </div>

      <!-- ================= PAYMENT TABLE ================= -->

      <div v-if="loading" class="py-10 text-center text-gray-500">
        Loading payments...
      </div>

      <table v-else class="min-w-full text-sm">
        <thead class="text-gray-600 bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left">Tenant</th>
            <th class="px-6 py-3 text-left">Room</th>
            <th class="px-6 py-3 text-left">Month</th>
            <th class="px-6 py-3 text-left">Amount</th>
            <th class="px-6 py-3 text-left">Status</th>
            <th class="px-6 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="payment in payments"
            :key="payment.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              {{ payment.contract?.user?.firstName }}
              {{ payment.contract?.user?.lastName }}
            </td>

            <td class="px-6 py-4">
              {{ payment.contract?.room?.roomNumber }}
            </td>

            <td class="px-6 py-4">
              {{ formatMonth(payment.billingMonth) }}
            </td>

            <td class="px-6 py-4 font-semibold">
              {{ Number(payment.amount || 0).toLocaleString() }} ฿
            </td>

            <td class="px-6 py-4">
              <span
                class="px-2 py-1 text-xs font-semibold rounded"
                :class="statusColor(payment.status)"
              >
                {{ payment.status }}
              </span>
            </td>

            <td class="px-6 py-4">

              <router-link
                v-if="payment.status === 'VERIFIED'"
                :to="{ name: 'confirmPayment', params: { paymentId: payment.id } }"
                class="inline-block px-3 py-1 text-xs text-white transition bg-green-600 rounded hover:bg-green-700"
              >
                🔍 Review & Confirm
              </router-link>

              <span
                v-else-if="payment.status === 'CONFIRMED'"
                class="font-semibold text-green-600"
              >
                Confirmed
              </span>

              <span v-else class="text-gray-400">-</span>

            </td>

          </tr>

          <tr v-if="payments.length === 0">
            <td colspan="6" class="py-10 text-center text-gray-400">
              No payments yet
            </td>
          </tr>

        </tbody>
      </table>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import api from "@/services/api"

/* ================= STATE ================= */

const payments = ref<any[]>([])
const contracts = ref<any[]>([])

const loading = ref(false)
const creating = ref(false)

const selectedContractId = ref("")

const newPayment = ref({
  amount: "",
  dueDate: ""
})

/* ================= AUTH ================= */

const getAuthHeaders = (): Record<string, string> => {

  const token = localStorage.getItem("token")

  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers

}

/* ================= FETCH CONTRACTS ================= */

const fetchContracts = async () => {

  const user = JSON.parse(localStorage.getItem("user") || "null")
  if (!user) return

  try {

    const res = await api.get(
      `/owners/${user.id}/contracts`,
      { headers: getAuthHeaders() }
    )

    const data = res.data

    contracts.value = Array.isArray(data) ? data : []

  } catch (err) {

    console.error("Fetch contracts error:", err)

    contracts.value = []

  }

}

/* ================= FETCH PAYMENTS ================= */

const fetchPayments = async () => {

  if (!selectedContractId.value) {

    payments.value = []
    return

  }

  try {

    loading.value = true

    const res = await api.get(
      `/payments/contract/${selectedContractId.value}`,
      { headers: getAuthHeaders() }
    )

    const data = res.data

    payments.value = Array.isArray(data) ? data : []

  } catch (err) {

    console.error("Fetch payments error:", err)

    payments.value = []

  } finally {

    loading.value = false

  }

}

/* ================= CREATE PAYMENT ================= */

const createPayment = async () => {

  if (
    !selectedContractId.value ||
    !newPayment.value.amount ||
    !newPayment.value.dueDate
  ) {

    alert("Please fill all fields")
    return

  }

  creating.value = true

  try {

    await api.post(
      `/payments/owner/create`,
      {
        contractId: Number(selectedContractId.value),
        amount: Number(newPayment.value.amount),
        billingMonth: new Date(),
        dueDate: newPayment.value.dueDate
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      }
    )

    newPayment.value.amount = ""
    newPayment.value.dueDate = ""

    fetchPayments()

  } catch (err) {

    console.error("Create payment error:", err)

    alert("Failed to create payment")

  } finally {

    creating.value = false

  }

}

/* ================= WATCH CONTRACT CHANGE ================= */

watch(selectedContractId, () => {

  fetchPayments()

})

/* ================= UTIL ================= */

const formatMonth = (date: string) => {

  if (!date) return "-"

  return new Date(date).toLocaleString("default", {
    month: "long",
    year: "numeric"
  })

}

const statusColor = (status: string) => {

  switch (status) {

    case "PENDING":
      return "bg-gray-100 text-gray-800"

    case "VERIFYING":
      return "bg-blue-100 text-blue-800"

    case "VERIFIED":
      return "bg-yellow-100 text-yellow-800"

    case "CONFIRMED":
      return "bg-green-100 text-green-800"

    case "REJECTED":
      return "bg-red-100 text-red-800"

    default:
      return ""

  }

}

/* ================= INIT ================= */

onMounted(() => {

  fetchContracts()

})
</script>

<style scoped>
.input {
  @apply px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>