<template>
  <div class="min-h-screen p-8 bg-gray-100">

    <div class="max-w-6xl mx-auto">

      <h1 class="mb-8 text-2xl font-bold">
        รายการบิลรายเดือน
      </h1>

      <!-- Loading -->
      <div v-if="loading" class="py-20 text-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>

      <!-- Empty -->
      <div v-else-if="payments.length === 0"
           class="p-10 text-center text-gray-400 bg-white shadow rounded-2xl">
        ยังไม่มีบิล
      </div>

      <!-- Cards -->
      <div v-else class="grid gap-6">

        <div
          v-for="payment in sortedPayments"
          :key="payment.id"
          class="p-6 bg-white shadow rounded-2xl"
        >

          <div class="flex items-center justify-between mb-4">

            <div>
              <div class="text-lg font-semibold">
                {{ formatMonth(payment.billingMonth) }}
              </div>
              <div class="text-sm text-gray-500">
                ครบกำหนด {{ formatDate(payment.dueDate) }}
              </div>
            </div>

            <div class="text-right">
              <div class="text-xl font-bold">
                {{ payment.amount.toLocaleString() }} ฿
              </div>

              <span
                class="status-badge"
                :class="statusColor(payment.status)"
              >
                {{ statusLabel(payment.status) }}
              </span>
            </div>

          </div>

          <!-- Reject Note -->
          <div
            v-if="payment.verificationNote"
            class="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
          >
            {{ payment.verificationNote }}
          </div>

          <!-- Action Row -->
          <div class="flex items-center gap-4">

            <!-- QR -->
            <button
              v-if="canGenerateQR(payment.status)"
              @click="openQR(payment)"
              class="primary-btn"
            >
              แสดง QR สำหรับชำระ
            </button>

            <!-- Upload -->
            <label
              v-if="canUpload(payment.status)"
              class="cursor-pointer secondary-btn"
            >
              อัปโหลดสลิป
              <input
                type="file"
                class="hidden"
                @change="handleFileUpload($event, payment.id)"
              />
            </label>

            <!-- Slip Preview -->
            <img
              v-if="payment.slipImageUrl"
              :src="backendURL + '/' + payment.slipImageUrl + '?t=' + Date.now()"
              class="object-cover w-16 h-16 border rounded"
            />

          </div>

        </div>

      </div>

    </div>

    <!-- ================= QR MODAL ================= -->
    <div
      v-if="showQR"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">

        <h2 class="mb-4 text-lg font-semibold text-center">
          ชำระเงิน {{ selectedPayment?.amount.toLocaleString() }} ฿
        </h2>

        <!-- Owner Info -->
        <div v-if="ownerInfo" class="p-4 mb-4 text-sm rounded-lg bg-gray-50">
          <div><strong>ธนาคาร:</strong> {{ ownerInfo.bankName }}</div>
          <div><strong>ชื่อบัญชี:</strong> {{ ownerInfo.bankAccountName }}</div>
          <div><strong>เลขบัญชี:</strong> {{ ownerInfo.bankAccountNo }}</div>
        </div>

        <!-- QR -->
        <img
          v-if="qrImage"
          :src="qrImage"
          class="mx-auto mb-6"
        />

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
import { ref, onMounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const payments = ref<any[]>([])
const loading = ref(true)
const backendURL = "http://localhost:5000"
const route = useRoute()
const router = useRouter()

const currentUser = JSON.parse(localStorage.getItem("user") || "null")

/* ================= AUTH ================= */

const getAuthHeaders = () => {
  const token = localStorage.getItem("token")

  if (!token) return {}

  return {
    Authorization: `Bearer ${token}`
  }
}

const handleUnauthorized = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  router.push("/login")
}

/* ================= FETCH PAYMENTS ================= */

const fetchPayments = async () => {
  try {
    loading.value = true

    let contractId: number | null = null

    if (route.params.contractId) {
      contractId = Number(route.params.contractId)
    }

    if (!contractId && currentUser?.id) {
      const res = await fetch(
        `${backendURL}/api/rental/member/${currentUser.id}`,
        { headers: getAuthHeaders() }
      )

      if (res.status === 401) return handleUnauthorized()
      if (!res.ok) return

      const requests = await res.json()

      const activeRequest = requests.find(
        (r: any) => r.leaseContract?.status === "ACTIVE"
      )

      if (!activeRequest?.leaseContract) {
        payments.value = []
        return
      }

      contractId = activeRequest.leaseContract.id
    }

    if (!contractId) {
      payments.value = []
      return
    }

    const res = await fetch(
      `${backendURL}/api/payments/contract/${contractId}`,
      { headers: getAuthHeaders() }
    )

    if (res.status === 401) return handleUnauthorized()
    if (!res.ok) return

    const data = await res.json()
    payments.value = Array.isArray(data) ? data : []

  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/* ================= SORT ================= */

const sortedPayments = computed(() => {
  return [...payments.value].sort((a, b) =>
    new Date(a.billingMonth).getTime() -
    new Date(b.billingMonth).getTime()
  )
})

/* ================= QR ================= */

const showQR = ref(false)
const qrImage = ref("")
const selectedPayment = ref<any>(null)
const ownerInfo = ref<any>(null)

const openQR = async (payment: any) => {
  try {
    selectedPayment.value = payment

    const res = await fetch(
      `${backendURL}/api/payments/contract/${payment.contractId}/qr`,
      { headers: getAuthHeaders() }
    )

    if (res.status === 401) return handleUnauthorized()
    if (!res.ok) return

    const data = await res.json()

    qrImage.value = data.qr
    ownerInfo.value = data.owner || null
    showQR.value = true

  } catch (err) {
    console.error(err)
  }
}

const closeQR = () => {
  showQR.value = false
  qrImage.value = ""
  ownerInfo.value = null
}

/* ================= UPLOAD ================= */

const handleFileUpload = async (event: any, paymentId: number) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append("slip", file)

  try {
    const res = await fetch(
      `${backendURL}/api/payments/${paymentId}/upload-slip`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      }
    )

    if (res.status === 401) return handleUnauthorized()

    const data = await res.json()

    if (!res.ok) {
      alert(data.message || "Upload failed")
      return
    }

    // refresh หลัง verify async
    setTimeout(fetchPayments, 1500)

  } catch (err) {
    console.error(err)
  } finally {
    event.target.value = "" // clear file input
  }
}

/* ================= UTIL ================= */

const canUpload = (status: string) =>
  status === "PENDING" || status === "REJECTED"

const canGenerateQR = (status: string) =>
  status === "PENDING" || status === "REJECTED"

const formatMonth = (date: string) =>
  new Date(date).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric"
  })

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("th-TH")

const statusLabel = (status: string) => {
  switch (status) {
    case "PENDING": return "รอชำระ"
    case "VERIFYING": return "กำลังตรวจสอบ"
    case "VERIFIED": return "รอยืนยันจากเจ้าของ"
    case "CONFIRMED": return "ชำระเรียบร้อย"
    case "REJECTED": return "ไม่ผ่าน"
    default: return status
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case "PENDING": return "bg-gray-100 text-gray-800"
    case "VERIFYING": return "bg-blue-100 text-blue-800"
    case "VERIFIED": return "bg-yellow-100 text-yellow-800"
    case "CONFIRMED": return "bg-green-100 text-green-800"
    case "REJECTED": return "bg-red-100 text-red-800"
    default: return ""
  }
}

onMounted(fetchPayments)
</script>

<style scoped>
.primary-btn {
  @apply px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700;
}
.secondary-btn {
  @apply px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700;
}
.status-badge {
  @apply inline-block px-3 py-1 mt-2 text-xs font-semibold rounded;
}
</style>