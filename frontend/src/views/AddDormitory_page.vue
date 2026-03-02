<template>
  <div class="min-h-screen p-10 bg-gray-100">
    <div class="max-w-4xl p-10 mx-auto bg-white shadow-2xl rounded-3xl">

      <!-- HEADER -->
      <div class="mb-10">
        <h2 class="text-3xl font-bold text-gray-800">
          Create New Dormitory
        </h2>
        <p class="mt-2 text-gray-500">
          Submit your dormitory for admin approval. Once approved,
          it will be visible to members.
        </p>
      </div>

      <!-- SUCCESS -->
      <div
        v-if="successMessage"
        class="p-4 mb-6 text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-xl"
      >
        {{ successMessage }}
      </div>

      <!-- ================= BASIC INFO ================= -->
      <section class="mb-10">
        <h3 class="section-title">Basic Information</h3>

        <div class="grid grid-cols-2 gap-6">

          <div class="col-span-2">
            <label class="label">Dormitory Name *</label>
            <input v-model="form.name" class="input" />
          </div>

          <div>
            <label class="label">Dormitory Type *</label>
            <select v-model="form.type" class="input">
              <option value="">Select Type</option>
              <option>Male</option>
              <option>Female</option>
              <option>Mixed</option>
            </select>
          </div>

          <div>
            <label class="label">Number of Rooms *</label>
            <input
              type="number"
              min="1"
              v-model="form.roomCount"
              class="input"
            />
          </div>

        </div>
      </section>

      <!-- ================= LOCATION ================= -->
      <section class="mb-10">
        <h3 class="section-title">Location</h3>

        <div class="space-y-6">

          <div>
            <label class="label">Address *</label>
            <input v-model="form.address" class="input" />
          </div>

          <div>
            <label class="label">Auto-detected Location</label>
            <input v-model="form.location" class="input bg-gray-50" disabled />
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="label">Latitude</label>
              <input type="number" v-model="form.latitude" class="input" />
            </div>

            <div>
              <label class="label">Longitude</label>
              <input type="number" v-model="form.longitude" class="input" />
            </div>
          </div>

          <div class="overflow-hidden border shadow rounded-2xl">
            <div id="map" class="h-72"></div>
          </div>

        </div>
      </section>

      <!-- ================= IMAGES ================= -->
      <section class="mb-10">
        <h3 class="section-title">Dormitory Images</h3>

        <div>
          <label class="label">Upload Images</label>
          <input
            type="file"
            multiple
            @change="handleFiles"
            class="w-full p-2 border rounded-lg"
          />
          <p class="mt-2 text-sm text-gray-400">
            You can upload multiple images.
          </p>
        </div>
      </section>

      <!-- SUBMIT -->
      <button
        @click="submitDormitory"
        :disabled="isSubmitting"
        class="w-full py-4 text-lg font-semibold text-white transition bg-blue-600 rounded-2xl hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isSubmitting
          ? "Submitting..."
          : "Submit Dormitory (Pending Approval)" }}
      </button>

    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted, reactive, ref } from "vue"
import L from "leaflet"

/* ✅ ใช้ ENV แทน localhost */
const backendURL = import.meta.env.VITE_API_URL

const currentUser = JSON.parse(localStorage.getItem("user") || "{}")

if (!currentUser || currentUser.role !== "OWNER") {
  alert("Access denied. Only owners can create dormitories.")
}

const form = reactive({
  name: "",
  type: "",
  address: "",
  location: "",
  latitude: null as number | null,
  longitude: null as number | null,
  roomCount: 1,
})

const files = ref<File[]>([])
const isSubmitting = ref(false)
const successMessage = ref("")

/* ================= MAP ================= */

let map: L.Map
let marker: L.Marker | null = null

onMounted(() => {
  map = L.map("map").setView([13.7367, 100.5231], 15)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map)

  map.on("click", async (e: any) => {
    const { lat, lng } = e.latlng

    form.latitude = Number(lat.toFixed(8))
    form.longitude = Number(lng.toFixed(8))

    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      marker = L.marker([lat, lng]).addTo(map)
    }

    await reverseGeocode(lat, lng)
  })
})

/* ================= FILE HANDLER ================= */

const handleFiles = (event: any) => {
  files.value = Array.from(event.target.files)
}

/* ================= REVERSE GEOCODE ================= */

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    )

    const data = await res.json()

    form.location = data.display_name || ""

    const addr = data.address || {}

    const formattedAddress = [
      addr.house_number,
      addr.road,
      addr.suburb || addr.village,
      addr.city || addr.town || addr.county,
      addr.state,
      addr.postcode
    ]
      .filter(Boolean)
      .join(", ")

    form.address = formattedAddress || data.display_name || ""

  } catch (error) {
    console.error("Reverse geocode error:", error)
  }
}

/* ================= SUBMIT ================= */

const submitDormitory = async () => {
  try {
    if (!form.name || !form.type || !form.address) {
      alert("Please complete all required fields")
      return
    }

    isSubmitting.value = true

    const formData = new FormData()

    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, String(value))
      }
    })

    formData.append("userId", currentUser.id)

    files.value.forEach(file => {
      formData.append("images", file)
    })

    const response = await fetch(`${backendURL}/dormitories`, {
      method: "POST",
      body: formData
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.message)

    successMessage.value =
      "Dormitory submitted successfully. Waiting for admin approval."

    resetForm()

  } catch (error: any) {
    alert(error.message)
  } finally {
    isSubmitting.value = false
  }
}

/* ================= RESET ================= */

const resetForm = () => {
  form.name = ""
  form.type = ""
  form.address = ""
  form.location = ""
  form.latitude = null
  form.longitude = null
  form.roomCount = 1
  files.value = []

  if (marker) {
    map.removeLayer(marker)
    marker = null
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none;
}

.label {
  @apply block mb-2 text-sm font-medium text-gray-700;
}

.section-title {
  @apply mb-6 text-xl font-semibold text-gray-800;
}
</style>