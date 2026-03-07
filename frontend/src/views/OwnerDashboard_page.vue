<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <div class="max-w-6xl mx-auto space-y-10">
      <!-- HEADER -->
      <div class="p-6 bg-white shadow-xl rounded-2xl">
        <h1 class="text-2xl font-bold">Owner Dashboard</h1>
        <p class="mt-2 text-gray-500">จัดการบิล สร้าง QR และดูรายได้</p>
      </div>

      <!-- ================= SUMMARY ================= -->
      <div class="grid grid-cols-5 gap-6">
        <div class="summary-card">
          <h3>รายได้ทั้งหมด</h3>
          <p>{{ totalIncome.toLocaleString() }} ฿</p>
        </div>

        <div class="summary-card">
          <h3>รอการชำระ</h3>
          <p>{{ pendingCount }}</p>
        </div>

        <div class="summary-card">
          <h3>จ่ายแล้ว</h3>
          <p>{{ confirmedCount }}</p>
        </div>

        <div class="summary-card">
          <h3>ห้องทั้งหมด</h3>
          <p>{{ totalRooms }}</p>
        </div>

        <div class="summary-card">
          <h3>อัตราเช่า</h3>
          <p>{{ occupancyRate }}%</p>
        </div>

        <!--upcomimg rent-->

        <div class="card">
          <h2 class="section-title">บิลใกล้ครบกำหนด</h2>

          <div v-if="upcomingPayments.length === 0" class="text-gray-400">ไม่มีบิลใกล้ครบกำหนด</div>

          <div v-else class="space-y-3">
            <div
              v-for="bill in upcomingPayments"
              :key="bill.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                ห้อง {{ bill.contract.room.roomNumber }}
                <div class="text-sm text-gray-500">
                  {{ formatMonth(bill.billingMonth) }}
                </div>
              </div>

              <div class="font-semibold">{{ Number(bill.amount).toLocaleString() }} ฿</div>

              <div class="text-sm text-red-500">ครบกำหนด {{ formatDate(bill.dueDate) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= SELECT CONTRACT ================= -->
      <div class="card">
        <h2 class="section-title">เลือกสัญญาเช่า</h2>

        <select v-model="selectedContractId" class="input">
          <option disabled value="">เลือก Contract</option>
          <option v-for="contract in contracts" :key="contract.id" :value="contract.id">
            ห้อง {{ contract.room.roomNumber }} - {{ contract.user.firstName }}
          </option>
        </select>
      </div>

      <!-- ================= CREATE BILL ================= -->
      <div class="card">
        <h2 class="section-title">สร้างบิลรายเดือน</h2>

        <div class="grid grid-cols-3 gap-4">
          <input type="month" v-model="billForm.billingMonth" class="input" />
          <input type="number" v-model="billForm.amount" placeholder="จำนวนเงิน" class="input" />
          <input type="date" v-model="billForm.dueDate" class="input" />
        </div>

        <button
          :disabled="!billForm.billingMonth || !billForm.amount || !billForm.dueDate"
          @click="createBill"
          class="mt-4 btn-primary disabled:bg-gray-400"
        >
          สร้างบิล
        </button>
      </div>

      <!-- ================= GENERATE CUSTOM QR ================= -->
      <div class="card">
        <h2 class="section-title">สร้าง QR เอง</h2>

        <div class="flex gap-4">
          <input type="number" v-model="customAmount" placeholder="ใส่จำนวนเงิน" class="input" />

          <button @click="generateCustomQR" class="btn-primary">สร้าง QR</button>
        </div>
      </div>

      <!-- ================= PAYMENT LIST ================= -->
      <div class="card">
        <h2 class="section-title">รายการบิล</h2>

        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="th">เดือน</th>
              <th class="th">จำนวนเงิน</th>
              <th class="th">สถานะ</th>
              <th class="th">จัดการ</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="payment in payments" :key="payment.id" class="border-t">
              <td class="td">
                {{ formatMonth(payment.billingMonth) }}
              </td>

              <td class="td">{{ Number(payment.amount).toLocaleString() }} ฿</td>

              <td class="td">
                <span :class="statusColor(payment.status)">
                  {{ payment.status }}
                </span>
              </td>

              <td class="td">
                <router-link
                  v-if="payment.status === 'VERIFIED'"
                  :to="{
                    name: 'ConfirmPayment',
                    params: { paymentId: payment.id },
                  }"
                  class="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                >
                  ตรวจสอบ & ยืนยัน
                </router-link>

                <span
                  v-else-if="payment.status === 'CONFIRMED'"
                  class="font-semibold text-green-600"
                >
                  ยืนยันแล้ว
                </span>

                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>

          <tr v-if="payments.length === 0">
            <td colspan="4" class="py-6 text-center text-gray-400">ยังไม่มีบิล</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- ================= QR MODAL ================= -->
    <div
      v-if="showQR"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="p-6 bg-white rounded-2xl w-96">
        <h2 class="mb-4 text-lg font-semibold text-center">QR {{ qrAmount.toLocaleString() }} ฿</h2>

        <img :src="qrImage" class="mx-auto mb-4" />

        <button
          @click="closeQR"
          class="w-full py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import api from "@/services/api"

const currentUser = JSON.parse(localStorage.getItem("user") || "null")

/* ================= STATE ================= */

const contracts = ref<any[]>([])
const selectedContractId = ref("")
const payments = ref<any[]>([])

const totalIncome = ref(0)
const pendingCount = ref(0)
const confirmedCount = ref(0)

const totalRooms = ref(0)
const occupiedRooms = ref(0)
const occupancyRate = ref(0)

const upcomingPayments = ref<any[]>([])

const billForm = ref({
  billingMonth: "",
  amount: "",
  dueDate: "",
})

const customAmount = ref("")
const showQR = ref(false)
const qrImage = ref("")
const qrAmount = ref(0)

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
  try {

    const res = await api.get(
      `/lease/owner/${currentUser.id}`,
      { headers: getAuthHeaders() }
    )

    contracts.value = res.data

    calculateRooms()

  } catch (error: any) {

    console.error("Fetch contracts error:", error)

  }
}

/* ================= ROOM SUMMARY ================= */

const calculateRooms = () => {

  totalRooms.value = contracts.value.length

  occupiedRooms.value = contracts.value.filter(
    (c:any) => c.status === "ACTIVE"
  ).length

  occupancyRate.value = totalRooms.value
    ? Math.round((occupiedRooms.value / totalRooms.value) * 100)
    : 0

}

/* ================= FETCH PAYMENTS ================= */

const fetchPayments = async () => {

  if (!selectedContractId.value) return

  try {

    const res = await api.get(
      `/payments/contract/${selectedContractId.value}`,
      { headers: getAuthHeaders() }
    )

    payments.value = res.data

    calculateSummary()

  } catch (error) {

    console.error("Fetch payments error:", error)

  }
}

/* ================= SUMMARY ================= */

const calculateSummary = () => {

  totalIncome.value = payments.value
    .filter((p:any) => p.status === "CONFIRMED")
    .reduce((sum:number, p:any) => sum + Number(p.amount), 0)

  pendingCount.value = payments.value.filter(
    (p:any) => p.status === "PENDING"
  ).length

  confirmedCount.value = payments.value.filter(
    (p:any) => p.status === "CONFIRMED"
  ).length

  /* ================= UPCOMING BILLS ================= */

  const now = new Date()

  upcomingPayments.value = payments.value.filter((p:any) => {

    const due = new Date(p.dueDate)

    const diff =
      (due.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)

    return diff <= 7 && p.status === "PENDING"

  })

}

/* ================= CREATE BILL ================= */

const createBill = async () => {

  if (!selectedContractId.value) return

  try {

    await api.post(
      `/payments/owner/create`,
      {
        contractId: selectedContractId.value,
        ...billForm.value
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      }
    )

    /* reset form */

    billForm.value = {
      billingMonth: "",
      amount: "",
      dueDate: ""
    }

    fetchPayments()

  } catch (error:any) {

    console.error("Create bill error:", error)

    alert(
      error.response?.data?.message ||
      "Failed to create bill"
    )

  }

}

/* ================= GENERATE CUSTOM QR ================= */

const generateCustomQR = async () => {

  try {

    const res = await api.post(
      `/payments/owner/generate-qr`,
      {
        ownerId: currentUser.id,
        amount: customAmount.value
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      }
    )

    qrImage.value = res.data.qr
    qrAmount.value = res.data.amount

    showQR.value = true

  } catch (error:any) {

    console.error("QR error:", error)

    alert(
      error.response?.data?.message ||
      "Failed to generate QR"
    )

  }

}

/* ================= CLOSE QR ================= */

const closeQR = () => {

  showQR.value = false
  qrImage.value = ""

}

/* ================= UTIL ================= */

const formatMonth = (date:string) => {

  return new Date(date).toLocaleDateString(
    "th-TH",
    {
      month: "long",
      year: "numeric"
    }
  )

}

const formatDate = (date:string) => {

  return new Date(date).toLocaleDateString()

}

const statusColor = (status:string) => {

  switch (status) {

    case "PENDING":
      return "px-2 py-1 text-xs bg-gray-100 rounded"

    case "CONFIRMED":
      return "px-2 py-1 text-xs text-white bg-green-600 rounded"

    case "VERIFIED":
      return "px-2 py-1 text-xs text-white bg-blue-600 rounded"

    default:
      return "px-2 py-1 text-xs bg-yellow-100 rounded"

  }

}

/* ================= WATCH ================= */

watch(
  selectedContractId,
  fetchPayments
)

/* ================= INIT ================= */

onMounted(() => {

  fetchContracts()

})

</script>

<style scoped>
.card {
  @apply p-6 bg-white shadow-xl rounded-2xl;
}

.section-title {
  @apply mb-4 text-lg font-semibold;
}

.input {
  @apply w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none;
}

.btn-primary {
  @apply px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700;
}

.summary-card {
  @apply p-6 bg-white shadow-xl rounded-2xl;
}

.summary-card h3 {
  @apply text-sm text-gray-500;
}

.summary-card p {
  @apply mt-2 text-xl font-bold;
}

.th {
  @apply px-4 py-2 text-left;
}

.td {
  @apply px-4 py-2;
}
</style>