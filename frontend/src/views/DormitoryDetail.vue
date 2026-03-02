<template>
  <div v-if="dormitory" class="min-h-screen bg-gray-100">
    <!-- HERO SECTION -->
    <div class="relative bg-gradient-to-r from-blue-600 to-indigo-600">

      <!-- BACK BUTTON -->
<button
  @click="goBack"
  class="absolute flex items-center gap-2 px-4 py-2 text-sm text-white transition rounded-full top-6 left-6 bg-white/20 backdrop-blur-md hover:bg-white/30"
>
  <span class="text-lg">←</span>
  <span>ย้อนกลับ</span>
</button>

      <div class="max-w-6xl px-6 py-16 mx-auto text-white">
        <h1 class="text-4xl font-bold">
          {{ dormitory.name }}
        </h1>

        <p class="mt-2 text-lg opacity-90">
          {{ dormitory.address }}
        </p>

        <div class="mt-4">
          <span class="px-4 py-1 text-sm font-medium bg-white rounded-full bg-opacity-20">
            ประเภท: {{ dormitory.type }}
          </span>
        </div>
      </div>
    </div>

    <!-- GALLERY -->
    <div class="max-w-6xl px-6 mx-auto -mt-10">
      <div class="relative overflow-hidden bg-white shadow-xl rounded-2xl">
        <div
          v-if="dormitory.images?.length"
          class="relative h-[420px]"
          @mouseenter="pauseAutoSlide"
          @mouseleave="startAutoSlide"
        >
          <!-- IMAGE -->
          <transition name="fade" mode="out-in">
            <img
              :key="currentImage"
              :src="backendURL + '/' + dormitory.images[currentImage].imageUrl"
              class="object-cover w-full h-full cursor-pointer"
              @click="openModal"
            />
          </transition>

          <!-- LEFT -->
          <button
            @click="prevImage"
            class="absolute p-3 -translate-y-1/2 rounded-full shadow left-4 top-1/2 bg-white/70 hover:bg-white"
          >
            ‹
          </button>

          <!-- RIGHT -->
          <button
            @click="nextImage"
            class="absolute p-3 -translate-y-1/2 rounded-full shadow right-4 top-1/2 bg-white/70 hover:bg-white"
          >
            ›
          </button>

          <!-- DOTS -->
          <div class="absolute flex gap-2 -translate-x-1/2 bottom-4 left-1/2">
            <span
              v-for="(img, index) in dormitory.images"
              :key="index"
              @click="goTo(Number(index))"
              class="w-3 h-3 transition rounded-full cursor-pointer"
              :class="index === currentImage ? 'bg-blue-600 scale-125' : 'bg-white/60'"
            />
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-[300px] text-gray-400">
          ไม่มีรูปภาพ
        </div>
      </div>
    </div>

    <!-- FULLSCREEN MODAL -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      @click.self="closeModal"
    >
      <div class="relative flex items-center justify-center w-full h-full">
        <transition name="fade" mode="out-in">
          <img
            :key="'modal-' + currentImage"
            :src="backendURL + '/' + dormitory.images[currentImage].imageUrl"
            class="max-w-[90%] max-h-[90%] object-contain"
          />
        </transition>

        <!-- CLOSE -->
        <button @click="closeModal" class="absolute text-3xl text-white top-6 right-8">✕</button>

        <!-- LEFT -->
        <button @click="prevImage" class="absolute text-5xl text-white left-10">‹</button>

        <!-- RIGHT -->
        <button @click="nextImage" class="absolute text-5xl text-white right-10">›</button>
      </div>
    </div>

    <div class="max-w-6xl px-6 py-10 mx-auto">
      <!-- ROOMS -->
      <section class="mb-16">
        <h2 class="mb-6 text-2xl font-bold text-gray-800">ห้องพักทั้งหมด</h2>

        <div v-if="dormitory.rooms.length" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="room in dormitory.rooms"
            :key="room.id"
            class="relative p-6 transition bg-white shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1"
          >
            <!-- Room Number -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">ห้อง {{ room.roomNumber }}</h3>

              <span
                class="px-3 py-1 text-xs font-medium rounded-full"
                :class="
                  room.status === 'AVAILABLE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                "
              >
                {{ room.status === 'AVAILABLE' ? 'ว่าง' : 'ไม่ว่าง' }}
              </span>
            </div>

            <!-- Price -->
            <div class="mb-6">
              <p class="text-2xl font-bold text-blue-600">{{ formatPrice(room.price) }} ฿</p>
              <p class="text-sm text-gray-500">ต่อเดือน</p>
            </div>

            <!-- Button -->
            <button
              :disabled="!isMember || room.status !== 'AVAILABLE'"
              @click="requestRental(room.id)"
              class="w-full py-2 font-medium text-white transition rounded-xl"
              :class="
                isMember && room.status === 'AVAILABLE'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90'
                  : 'bg-gray-400 cursor-not-allowed'
              "
            >
              ส่งคำขอเช่า
            </button>

            <p v-if="!isMember" class="mt-2 text-xs text-red-500">เฉพาะสมาชิกเท่านั้น</p>
          </div>
        </div>

        <div v-else class="p-10 text-center text-gray-500 bg-white shadow rounded-xl">
          ยังไม่มีห้องพัก
        </div>
      </section>

      <!-- REVIEWS -->
      <section>
        <h2 class="mb-6 text-2xl font-bold text-gray-800">รีวิวจากผู้พัก</h2>

        <div v-if="dormitory.reviews.length" class="space-y-6">
          <div
            v-for="review in dormitory.reviews"
            :key="review.id"
            class="p-6 bg-white shadow rounded-2xl"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="font-semibold text-gray-800">
                {{ review.user.username }}
              </p>

              <div class="flex text-yellow-400">
                <span v-for="n in 5" :key="n" class="text-lg">
                  {{ n <= review.rating ? '★' : '☆' }}
                </span>
              </div>
            </div>

            <p class="text-gray-600">
              {{ review.comment }}
            </p>
          </div>
        </div>

        <div v-else class="p-10 text-center text-gray-500 bg-white shadow rounded-xl">
          ยังไม่มีรีวิว
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

const dormitory = ref<any>(null)
const currentUser = ref<any>(null)

const currentImage = ref(0)
const isModalOpen = ref(false)

let interval: ReturnType<typeof setInterval> | null = null

/* ================= IMAGE SLIDER ================= */
const nextImage = () => {
  if (!dormitory.value?.images?.length) return
  currentImage.value =
    (currentImage.value + 1) % dormitory.value.images.length
}

const prevImage = () => {
  if (!dormitory.value?.images?.length) return
  currentImage.value =
    (currentImage.value - 1 + dormitory.value.images.length) %
    dormitory.value.images.length
}

const goTo = (index: number) => {
  currentImage.value = index
}

const startAutoSlide = () => {
  if (!dormitory.value?.images?.length) return
  interval = setInterval(nextImage, 5000)
}

const pauseAutoSlide = () => {
  if (interval) clearInterval(interval)
}

/* ================= MODAL ================= */
const openModal = () => {
  isModalOpen.value = true
  document.body.style.overflow = "hidden"
}

const closeModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = "auto"
}

/* ================= USER ================= */
const isMember = computed(() =>
  currentUser.value?.role === 'MEMBER'
)

/* ================= FETCH DATA ================= */
const fetchDormitory = async () => {
  try {
    const { data } = await api.get(
      `/dormitories/${route.params.id}`
    )
    dormitory.value = data
    startAutoSlide()
  } catch (err) {
    console.error("Fetch dormitory error:", err)
  }
}

/* ================= RENTAL REQUEST ================= */
const requestRental = async (roomId: number) => {
  if (!currentUser.value) {
    alert('กรุณาเข้าสู่ระบบก่อน')
    router.push('/login')
    return
  }

  if (!isMember.value) {
    alert('กรุณาสมัครสมาชิกก่อนส่งคำขอเช่า')
    return
  }

  try {
    await api.post('/rental/request', {
      roomId,
      userId: currentUser.value.id,
    })

    alert('ส่งคำขอเช่าสำเร็จ 🎉')
  } catch (error) {
    console.error(error)
    alert('เกิดข้อผิดพลาดในการส่งคำขอ')
  }
}

/* ================= NAVIGATION ================= */
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/member/home')
  }
}

const formatPrice = (price: number) =>
  Number(price).toLocaleString()

/* ================= LIFECYCLE ================= */
onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser)
  }

  fetchDormitory()

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal()
  })
})

onBeforeUnmount(() => {
  pauseAutoSlide()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>