<template>
  <div class="min-h-screen p-6 bg-gray-100">

    <!-- HEADER -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">
        รายละเอียดสัญญาเช่า
      </h1>

      <p class="text-gray-500">
        ข้อมูลผู้เช่าและประวัติการชำระเงิน
      </p>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="p-10 text-center text-gray-500">
      กำลังโหลดข้อมูล...
    </div>

    <div v-else-if="contract" class="space-y-6">

      <!-- ================= TENANT INFO ================= -->
      <div class="grid gap-6 md:grid-cols-2">

        <div class="card">
          <h2 class="section-title">ข้อมูลผู้เช่า</h2>

          <div class="space-y-2 text-sm">

            <p>
              <b>ชื่อ:</b>
              {{ contract.user.firstName }}
              {{ contract.user.lastName }}
            </p>

            <p>
              <b>Username:</b>
              {{ contract.user.username }}
            </p>

            <p>
              <b>Email:</b>
              {{ contract.user.email }}
            </p>

          </div>
        </div>

        <!-- ROOM INFO -->
        <div class="card">
          <h2 class="section-title">ข้อมูลห้อง</h2>

          <div class="space-y-2 text-sm">

            <p>
              <b>หอพัก:</b>
              {{ contract.room.dormitory.name }}
            </p>

            <p>
              <b>ห้อง:</b>
              {{ contract.room.roomNumber }}
            </p>

            <p>
              <b>ค่าเช่า:</b>
              {{ Number(contract.room.price).toLocaleString() }} ฿
            </p>

          </div>

        </div>

      </div>

      <!-- ================= CONTRACT INFO ================= -->

      <div class="card">

        <h2 class="section-title">รายละเอียดสัญญา</h2>

        <div class="grid gap-4 text-sm md:grid-cols-3">

          <div>
            <p class="text-gray-500">วันเริ่มสัญญา</p>
            <p class="font-medium">
              {{ formatDate(contract.startDate) }}
            </p>
          </div>

          <div>
            <p class="text-gray-500">วันสิ้นสุด</p>
            <p class="font-medium">
              {{ formatDate(contract.endDate) }}
            </p>
          </div>

          <div>
            <p class="text-gray-500">สถานะ</p>

            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="statusClass(contract.status)"
            >
              {{ statusText(contract.status) }}
            </span>

          </div>

        </div>

      </div>

      <!-- ================= PAYMENT HISTORY ================= -->

      <div class="card">

        <h2 class="section-title">
          ประวัติการชำระเงิน
        </h2>

        <table class="w-full text-sm">

          <thead class="bg-gray-50">

            <tr>
              <th class="th">เดือน</th>
              <th class="th">จำนวนเงิน</th>
              <th class="th">กำหนดชำระ</th>
              <th class="th">สถานะ</th>
            </tr>

          </thead>

          <tbody>

            <tr
              v-for="payment in payments"
              :key="payment.id"
              class="border-t"
            >

              <td class="td">
                {{ formatMonth(payment.billingMonth) }}
              </td>

              <td class="td">
                {{ Number(payment.amount).toLocaleString() }} ฿
              </td>

              <td class="td">
                {{ formatDate(payment.dueDate) }}
              </td>

              <td class="td">

                <span
                  class="px-2 py-1 text-xs rounded-full"
                  :class="paymentStatusClass(payment.status)"
                >
                  {{ payment.status }}
                </span>

              </td>

            </tr>

            <tr v-if="payments.length === 0">

              <td colspan="4" class="py-6 text-center text-gray-400">
                ยังไม่มีข้อมูลการชำระเงิน
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
import { useRoute } from "vue-router"
import api from "@/services/api"

const route = useRoute()

const contract = ref<any | null>(null)
const payments = ref<any[]>([])
const loading = ref(true)

/* ================= FETCH CONTRACT ================= */

const fetchContract = async () => {

  try {

    const { data } = await api.get(
      `/contracts/${route.params.contractId}`
    )

    contract.value = data

  } catch (error) {

    console.error("Fetch contract error:", error)

  }

}

/* ================= FETCH PAYMENTS ================= */

const fetchPayments = async () => {

  try {

    const { data } = await api.get(
      `/payments/contract/${route.params.contractId}`
    )

    payments.value = data

  } catch (error) {

    console.error("Fetch payments error:", error)

  }

}

/* ================= UTIL ================= */

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("th-TH")
}

const formatMonth = (date: string) => {

  return new Date(date).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric"
  })

}

const statusClass = (status: string) => {

  switch (status) {

    case "ACTIVE":
      return "bg-green-100 text-green-700"

    case "EXPIRED":
      return "bg-gray-200 text-gray-700"

    default:
      return "bg-yellow-100 text-yellow-700"

  }

}

const statusText = (status: string) => {

  switch (status) {

    case "ACTIVE":
      return "กำลังเช่า"

    case "EXPIRED":
      return "หมดสัญญา"

    default:
      return status

  }

}

const paymentStatusClass = (status: string) => {

  switch (status) {

    case "CONFIRMED":
      return "bg-green-100 text-green-700"

    case "VERIFIED":
      return "bg-blue-100 text-blue-700"

    case "PENDING":
      return "bg-yellow-100 text-yellow-700"

    default:
      return "bg-gray-100 text-gray-600"

  }

}

/* ================= INIT ================= */

onMounted(async () => {

  loading.value = true

  await Promise.all([
    fetchContract(),
    fetchPayments()
  ])

  loading.value = false

})

</script>

<style scoped>

.card {
  @apply p-6 bg-white shadow rounded-xl;
}

.section-title {
  @apply mb-4 text-lg font-semibold;
}

.th {
  @apply px-4 py-2 text-left text-gray-600;
}

.td {
  @apply px-4 py-2;
}

</style>