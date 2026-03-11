<template>
  <div class="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-5xl mx-auto">

      <!-- HEADER -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight">
          Confirm Payment
        </h1>
        <p class="mt-2 text-gray-500">
          Review tenant payment slip and approve or reject.
        </p>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="p-10 text-center bg-white shadow rounded-2xl">
        <p class="text-gray-500 animate-pulse">Loading payment details...</p>
      </div>

      <!-- PAYMENT CARD -->
      <div
        v-else-if="payment"
        class="grid gap-8 p-8 bg-white shadow-xl rounded-2xl md:grid-cols-2"
      >

        <!-- LEFT SIDE -->
        <div class="space-y-6">

          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Payment Information</h2>

            <span
              class="px-3 py-1 text-xs font-semibold rounded-full"
              :class="statusBadge(payment.status)"
            >
              {{ payment.status }}
            </span>
          </div>

          <!-- PAYMENT DATA -->
          <div class="space-y-3 text-sm">

            <div class="flex justify-between">
              <span class="text-gray-500">Tenant</span>
              <span class="font-medium">
                {{ payment.contract?.user?.firstName }}
                {{ payment.contract?.user?.lastName }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-500">Room</span>
              <span class="font-medium">
                {{ payment.contract?.room?.roomNumber }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-500">Contract ID</span>
              <span class="font-medium">{{ payment.contractId }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-500">Amount</span>
              <span class="text-lg font-bold text-blue-600">
                ฿{{ Number(payment.amount).toLocaleString() }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-500">Billing Month</span>
              <span class="font-medium">
                {{ formatDate(payment.billingMonth) }}
              </span>
            </div>

            <div v-if="payment.transactionRef" class="flex justify-between">
              <span class="text-gray-500">Transaction Ref</span>
              <span class="font-medium">
                {{ payment.transactionRef }}
              </span>
            </div>

          </div>

          <!-- AI RESULT -->
          <div
            class="p-4 border rounded-xl"
            :class="payment.verifiedByAI
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'"
          >

            <div class="flex items-center gap-2 font-semibold">

              <span
                v-if="payment.verifiedByAI"
                class="text-green-600"
              >
                ✔ AI Verified
              </span>

              <span
                v-else
                class="text-red-600"
              >
                ⚠ AI Flagged
              </span>

            </div>

            <p
              v-if="payment.verificationNote"
              class="mt-2 text-sm"
              :class="payment.verifiedByAI
                ? 'text-green-700'
                : 'text-red-700'"
            >
              {{ payment.verificationNote }}
            </p>

          </div>

        </div>

        <!-- RIGHT SIDE -->
        <div class="space-y-4">

          <h2 class="text-lg font-semibold">Slip Preview</h2>

          <div
            class="flex items-center justify-center p-4 bg-gray-50 border rounded-xl min-h-[320px]"
          >

            <img
              v-if="payment.slipImageUrl && !imageError"
              :src="payment.slipImageUrl"
              class="object-contain max-h-[420px] rounded-lg shadow"
              @error="imageError = true"
            />

            <div v-else-if="imageError" class="text-sm text-red-500">
              Cannot load slip image
            </div>

            <div v-else class="text-gray-400">
              No slip uploaded
            </div>

          </div>

        </div>

      </div>

      <!-- ACTION BUTTONS -->
      <div
        v-if="payment && (payment.status === 'VERIFIED' || payment.status === 'REJECTED')"
        class="flex justify-end gap-4 mt-8"
      >

        <button
          @click="rejectPayment"
          class="px-6 py-2 text-white transition bg-red-500 rounded-xl hover:bg-red-600"
        >
          Reject
        </button>

        <button
          @click="confirmPayment"
          class="px-6 py-2 text-white transition bg-green-600 rounded-xl hover:bg-green-700"
        >
          Approve Payment
        </button>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import api from "@/services/api"

const route = useRoute()
const router = useRouter()

const paymentId = Number(route.params.paymentId)

const payment = ref<any>(null)
const loading = ref(true)
const imageError = ref(false)

/* FETCH PAYMENT */
const fetchPayment = async () => {

  try {

    const { data } = await api.get(`/payments/${paymentId}`)

    payment.value = data

    console.log("Payment data:", data)

  } catch (err) {

    console.error("Fetch payment error:", err)

  } finally {

    loading.value = false

  }

}

/* APPROVE PAYMENT */
const confirmPayment = async () => {

  try {

    await api.patch(`/payments/${paymentId}/confirm`)

    alert("Payment confirmed")

    router.push({ name: "OwnerPayments" })

  } catch (err:any) {

    console.error("Confirm error:", err)

    alert(err?.response?.data?.message || "Failed to confirm payment")

  }

}

/* REJECT PAYMENT */
const rejectPayment = async () => {

  const reason = prompt("Enter rejection reason")

  if (!reason) return

  try {

    await api.patch(`/payments/${paymentId}/reject`, {
      reason
    })

    alert("Payment rejected")

    router.push({ name: "OwnerPayments" })

  } catch (err:any) {

    console.error("Reject error:", err)

    alert(err?.response?.data?.message || "Failed to reject payment")

  }

}

/* FORMAT DATE */
const formatDate = (date:string) => {

  return new Date(date).toLocaleDateString("th-TH")

}

/* STATUS BADGE */
const statusBadge = (status:string) => {

  switch (status) {

    case "PENDING":
      return "bg-gray-100 text-gray-700"

    case "VERIFYING":
      return "bg-blue-100 text-blue-700"

    case "VERIFIED":
      return "bg-yellow-100 text-yellow-800"

    case "CONFIRMED":
      return "bg-green-100 text-green-700"

    case "REJECTED":
      return "bg-red-100 text-red-700"

    default:
      return "bg-gray-100 text-gray-700"

  }

}

onMounted(fetchPayment)

</script>