<template>
  <div class="min-h-screen bg-gray-50">
    <div class="relative px-6 pt-8 mx-auto max-w-7xl">
      <!-- ================= MAP ================= -->
      <div class="relative mb-12 overflow-hidden shadow-lg rounded-3xl">
        <div id="map" class="w-full h-[480px] z-0"></div>

        <!-- 🔥 FLOATING CONTROL BAR -->
        <div class="absolute z-50 w-full px-6 top-6">
          <div class="flex flex-col items-end gap-4 md:flex-row md:justify-end">
            <!-- SEARCH -->
            <div class="relative w-full max-w-md">
              <input
                v-model="universitySearch"
                placeholder="ค้นหามหาวิทยาลัย..."
                class="w-full px-5 py-3 transition border border-gray-200 rounded-full shadow-xl outline-none bg-white/95 backdrop-blur-md focus:ring-2 focus:ring-rose-400"
                @focus="showResults = true"
                @keyup.enter="manualSearch"
              />

              <!-- DROPDOWN -->
              <ul
                v-if="showResults && results.length"
                class="absolute left-0 right-0 z-[999] mt-2 overflow-auto bg-white border shadow-2xl rounded-2xl max-h-60"
              >
                <li
                  v-for="(item, index) in results"
                  :key="index"
                  class="px-4 py-3 text-sm transition cursor-pointer hover:bg-gray-100"
                  @click="selectUniversity(item)"
                >
                  {{ item.display_name }}
                </li>
              </ul>
            </div>

            <!-- FILTER GROUP -->
            <div
              class="flex items-center gap-4 px-4 py-2 rounded-full shadow-xl bg-white/95 backdrop-blur-md"
            >
              <select
                v-model="selectedType"
                class="px-3 py-1 text-sm bg-transparent border-none outline-none"
              >
                <option value="">ทุกประเภท</option>
                <option value="Male">ชาย</option>
                <option value="Female">หญิง</option>
                <option value="Mixed">รวม</option>
              </select>

              <div class="w-px h-5 bg-gray-200"></div>

              <select
                v-model="radius"
                class="px-3 py-1 text-sm bg-transparent border-none outline-none"
              >
                <option :value="1">1 กม.</option>
                <option :value="3">3 กม.</option>
                <option :value="5">5 กม.</option>
                <option :value="10">10 กม.</option>
              </select>

              <div class="w-px h-5 bg-gray-200"></div>

              <span class="text-sm text-gray-500 whitespace-nowrap">
                {{ filteredDormitories.length }} แห่ง
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= TITLE ================= -->
      <h2 class="mb-6 text-2xl font-semibold">หอพักทั้งหมด</h2>
      <!-- สมัครสมาชิก -->
      <button
        v-if="!isMember"
        @click="goToRegister"
        class="px-4 py-2 text-sm font-medium text-white transition rounded-full shadow-md bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90"
      >
        สมัครสมาชิก
      </button>

      <!-- ================= GRID ================= -->
      <TransitionGroup
        name="fade"
        tag="div"
        class="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="dorm in filteredDormitories"
          :key="dorm.id"
          class="cursor-pointer group"
          @click="goToDetail(dorm.id)"
        >
          <div
            class="overflow-hidden transition duration-300 bg-white shadow-sm rounded-3xl hover:shadow-xl"
          >
            <div class="relative w-full h-56 overflow-hidden bg-gray-200">
              <!-- Skeleton -->
              <div
                v-if="!dorm.images?.length"
                class="absolute inset-0 bg-gray-300 animate-pulse"
              ></div>

              <!-- Image -->
              <img
                v-if="dorm.images?.length"
                loading="lazy"
                :src="dorm.images[0].imageUrl"
                @error="handleImgError"
                class="object-cover w-full h-56 transition duration-500 group-hover:scale-105"
              />
            </div>

            <div class="p-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">
                  {{ dorm.name }}
                </h3>
                <span class="text-sm text-yellow-500">⭐ 4.8</span>
              </div>

              <p class="mt-1 text-sm text-gray-500">
                {{ dorm.address }}
              </p>

              <p class="mt-2 font-semibold text-gray-900">
                ฿{{ dorm.rooms?.[0]?.price || 0 }} / เดือน
              </p>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- NO RESULT -->
      <div v-if="filteredDormitories.length === 0" class="mt-12 text-center text-gray-500">
        ไม่พบหอพักในรัศมีที่เลือก
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import { useRouter } from 'vue-router'
import api from '@/services/api'

// =========================
// STATE
// =========================
const universitySearch = ref('')
const results = ref<any[]>([])
const showResults = ref(false)
const selectedType = ref('')

const router = useRouter()

const radius = ref(3)
const selectedCenter = ref<{ lat: number; lon: number } | null>(null)

const dormitories = ref<any[]>([])

let debounceTimer: number | undefined
let map: L.Map
let universityMarker: L.Marker | null = null
let radiusCircle: L.Circle | null = null
let markers: L.Marker[] = []

const currentUser = ref<any>(null)

const isMember = computed(() => currentUser.value?.role === 'MEMBER')

const goToRegister = () => {
  if (!currentUser.value) {
    router.push('/login')
    return
  }
  router.push('/register')
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser)
  }
})

const goToDetail = (id: number) => {
  router.push(`/dormitories/${id}`)
}

const handleImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/placeholder-dorm.jpg'
}

// =========================
// DISTANCE FUNCTION
// =========================
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// =========================
// FILTER DORMITORIES
// =========================
const filteredDormitories = computed(() => {
  let result = dormitories.value

  // กรองตามประเภทก่อน
  if (selectedType.value) {
    result = result.filter((d) => d.type === selectedType.value)
  }

  // ถ้ามี selectedCenter ให้กรองตามระยะทาง
  if (selectedCenter.value) {
    result = result.filter((d) => {
      if (!d.latitude || !d.longitude) return false

      const distance = getDistanceKm(
        selectedCenter.value?.lat || 0,
        selectedCenter.value?.lon || 0,
        d.latitude,
        d.longitude
      )

      return distance <= radius.value
    })
  }

  return result
})

// =========================
// WATCH RADIUS CHANGE
// =========================
watch(radius, (newRadius) => {
  if (!selectedCenter.value) return

  if (radiusCircle) map.removeLayer(radiusCircle)

  radiusCircle = L.circle([selectedCenter.value.lat, selectedCenter.value.lon], {
    radius: newRadius * 1000,
    color: '#2563eb',
    fillColor: '#3b82f6',
    fillOpacity: 0.15,
  }).addTo(map)

  loadMarkers()
})

// =========================
// DEBOUNCE SEARCH
// =========================
watch(universitySearch, (newValue) => {
  clearTimeout(debounceTimer)

  if (!newValue || newValue.length < 3) {
    results.value = []
    return
  }

  debounceTimer = window.setTimeout(() => {
    searchUniversity(newValue)
  }, 600)
})

// =========================
// MAP ICON
// =========================
const blueIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// =========================
// INIT MAP
// =========================
const initMap = () => {
  map = L.map('map').setView([13.7563, 100.5018], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)
}

// =========================
// FETCH DORMITORIES
// =========================
const fetchDormitories = async () => {
  try {
    const { data } = await api.get('/dormitories')

    dormitories.value = Array.isArray(data) ? data : []

    loadMarkers()
  } catch (error) {
    console.error('Failed to fetch dormitories:', error)
  }
}

// =========================
// LOAD MARKERS
// =========================
const loadMarkers = () => {
  markers.forEach((m) => map.removeLayer(m))
  markers = []

  filteredDormitories.value.forEach((dorm) => {
    if (dorm.latitude && dorm.longitude) {
      const marker = L.marker([dorm.latitude, dorm.longitude], { icon: blueIcon })
        .addTo(map)
        .bindPopup(`<b>${dorm.name}</b>`)

      // 🔥 เพิ่ม click event ตรงนี้
      marker.on('click', () => {
        map.flyTo([dorm.latitude, dorm.longitude], 16, {
          animate: true,
          duration: 1,
        })

        setTimeout(() => {
          router.push(`/dormitories/${dorm.id}`)
        }, 500)
      })

      markers.push(marker)
    }
  })
}

// =========================
// SEARCH UNIVERSITY
// =========================
const searchUniversity = async (keyword: string) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
        keyword
      )}`
    )

    const data = await response.json()
    results.value = data
  } catch (error) {
    console.error('Search error:', error)
  }
}

// =========================
// SELECT UNIVERSITY
// =========================
const selectUniversity = (item: any) => {
  const lat = parseFloat(item.lat)
  const lon = parseFloat(item.lon)

  selectedCenter.value = { lat, lon }

  map.flyTo([lat, lon], 14, {
    animate: true,
    duration: 1.5,
  })

  if (universityMarker) map.removeLayer(universityMarker)

  universityMarker = L.marker([lat, lon], { icon: blueIcon })
    .addTo(map)
    .bindPopup(`<b>${item.display_name}</b>`)
    .openPopup()

  if (radiusCircle) map.removeLayer(radiusCircle)

  radiusCircle = L.circle([lat, lon], {
    radius: radius.value * 1000,
    color: '#f43f5e',
    fillColor: '#fda4af',
    fillOpacity: 0.2,
  }).addTo(map)

  results.value = []
  showResults.value = false

  loadMarkers()
}

const manualSearch = () => {
  if (universitySearch.value.length >= 3) {
    searchUniversity(universitySearch.value)
  }
}

// =========================
// INIT
// =========================
onMounted(async () => {
  await nextTick() // 🔥 รอ DOM render
  initMap()
  fetchDormitories()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
