<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <div class="max-w-6xl mx-auto">

      <h1 class="mb-8 text-3xl font-bold">
        🏢 Dormitory Approval Management
      </h1>

      <!-- Loading -->
      <div v-if="loading" class="py-10 text-center text-gray-500">
        Loading pending dormitories...
      </div>

      <div v-else>

        <!-- Dorm List -->
        <div
          v-for="dorm in dormitories"
          :key="dorm.id"
          class="p-6 mb-6 bg-white shadow-xl rounded-2xl"
        >
          <!-- Header -->
          <div class="relative flex justify-between mb-6">

  <!-- Left Content -->
  <div>
    <h2 class="text-xl font-bold">{{ dorm.name }}</h2>
    <p class="text-gray-500">{{ dorm.address }}</p>

    <p
      v-if="dorm.owner?.user"
      class="mt-1 text-sm text-blue-600"
    >
      Owner:
      {{ dorm.owner.user.firstName }}
      {{ dorm.owner.user.lastName }}
      ({{ dorm.owner.user.email }})
    </p>
  </div>

  <!-- 🔥 Status Badge -->
  <div class="absolute top-0 right-0">
    <span
      class="inline-flex items-center px-4 py-2 text-xs font-semibold tracking-wide text-yellow-800 uppercase bg-yellow-100 rounded-full shadow-sm"
    >
      🟡 Pending
    </span>
  </div>

</div>

          <!-- Images -->
          <div
            v-if="dorm.images?.length"
            class="flex gap-3 mb-4 overflow-x-auto"
          >
            <img
              v-for="img in dorm.images"
              :key="img.id"
              :src="BASE_URL + img.imageUrl"
              class="object-cover w-40 rounded-lg shadow h-28"
            />
          </div>

          <!-- Info -->
          <div class="grid grid-cols-3 gap-4 mb-6 text-sm text-gray-600">
            <div>
              <strong>Type:</strong> {{ dorm.type }}
            </div>
            <div>
              <strong>Total Rooms:</strong> {{ dorm.rooms?.length || 0 }}
            </div>
            <div>
              <strong>Location:</strong> {{ dorm.location || "-" }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="approveDorm(dorm.id)"
              class="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Approve
            </button>

            <button
              @click="openRejectModal(dorm.id)"
              class="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>

        <div v-if="dormitories.length === 0" class="text-center text-gray-500">
          No pending dormitories 🎉
        </div>

      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="showReject"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40"
    >
      <div class="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl">
        <h2 class="mb-4 text-lg font-semibold">
          Reject Dormitory
        </h2>

        <textarea
          v-model="rejectReason"
          placeholder="Enter rejection reason..."
          class="w-full p-3 border rounded-lg"
        />

        <div class="flex justify-end gap-3 mt-4">
          <button
            @click="showReject = false"
            class="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            @click="confirmReject"
            class="px-4 py-2 text-white bg-red-600 rounded-lg"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import api from "@/services/api"

const router = useRouter()

const dormitories = ref<any[]>([])
const loading = ref(true)
const errorMessage = ref("")

const showReject = ref(false)
const rejectDormId = ref<number | null>(null)
const rejectReason = ref("")

const BASE_URL = import.meta.env.VITE_BACKEND_URL

/* ================= AUTH HEADER ================= */

const getAuthHeaders = () => {
  const token = localStorage.getItem("token")

  if (!token) {
    router.push("/login")
    throw new Error("Token missing")
  }

  return {
    Authorization: `Bearer ${token}`
  }
}

/* ================= HANDLE UNAUTHORIZED ================= */

const handleUnauthorized = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")

  alert("Session expired. Please login again.")
  router.push("/login")
}

/* ================= FETCH PENDING DORMITORIES ================= */

const fetchDorms = async () => {
  try {

    loading.value = true
    errorMessage.value = ""

    const res = await api.get("/dormitories/pending", {
      headers: getAuthHeaders()
    })

    dormitories.value = res.data

  } catch (err: any) {

    console.error("Fetch error:", err)

    if (err.response?.status === 401) {
      handleUnauthorized()
      return
    }

    errorMessage.value =
      err.response?.data?.message ||
      "Failed to load dormitories"

    dormitories.value = []

  } finally {

    loading.value = false

  }
}

/* ================= APPROVE ================= */

const approveDorm = async (id: number) => {

  if (!confirm("Approve this dormitory?")) return

  try {

    await api.patch(
      `/dormitories/${id}/approve`,
      {},
      {
        headers: getAuthHeaders()
      }
    )

    fetchDorms()

  } catch (err: any) {

    console.error("Approve error:", err)

    if (err.response?.status === 401) {
      handleUnauthorized()
      return
    }

    alert(
      err.response?.data?.message ||
      "Approve failed"
    )

  }

}

/* ================= REJECT ================= */

const openRejectModal = (id: number) => {

  rejectDormId.value = id
  rejectReason.value = ""
  showReject.value = true

}

const confirmReject = async () => {

  if (!rejectDormId.value) return

  try {

    await api.patch(
      `/dormitories/${rejectDormId.value}/reject`,
      {
        rejectionNote: rejectReason.value
      },
      {
        headers: getAuthHeaders()
      }
    )

    showReject.value = false

    fetchDorms()

  } catch (err: any) {

    console.error("Reject error:", err)

    if (err.response?.status === 401) {
      handleUnauthorized()
      return
    }

    alert(
      err.response?.data?.message ||
      "Reject failed"
    )

  }

}

/* ================= INIT ================= */

onMounted(fetchDorms)

</script>