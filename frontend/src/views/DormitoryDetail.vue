<template>
  <div v-if="dormitory" class="min-h-screen bg-gray-100">

    <!-- HERO -->
    <div class="relative bg-gradient-to-r from-blue-600 to-indigo-600">

      <button
        @click="goBack"
        class="absolute flex items-center gap-2 px-4 py-2 text-white rounded-full top-6 left-6 bg-white/20 hover:bg-white/30"
      >
        ← ย้อนกลับ
      </button>

      <div class="max-w-6xl px-6 py-16 mx-auto text-white">
        <h1 class="text-4xl font-bold">{{ dormitory.name }}</h1>
        <p class="mt-2 text-lg opacity-90">{{ dormitory.address }}</p>

        <div class="flex items-center gap-3 mt-4">

          <span class="px-4 py-1 text-sm bg-white rounded-full bg-opacity-20">
            {{ dormitory.type }}
          </span>

          <!-- Average Rating -->
          <div v-if="averageRating" class="flex items-center gap-1 text-yellow-300">
            <span v-for="n in 5" :key="n">
              {{ n <= Math.round(averageRating) ? '★' : '☆' }}
            </span>

            <span class="ml-2 text-sm text-white">
              {{ averageRating.toFixed(1) }} ({{ dormitory.reviews.length }})
            </span>
          </div>

        </div>
      </div>
    </div>

    <!-- GALLERY -->
    <div class="max-w-6xl px-6 mx-auto -mt-10">
      <div class="overflow-hidden bg-white shadow-xl rounded-2xl">

        <div
  v-if="dormitory.images && dormitory.images.length"
  class="relative h-[420px]"
>
  <img
    :src="dormitory.images[currentImage].imageUrl"
    class="object-cover w-full h-full"
  />

  <button
    v-if="dormitory.images.length > 1"
    @click="prevImage"
    class="absolute p-3 bg-white rounded-full left-4 top-1/2"
  >
    ‹
  </button>

  <button
    v-if="dormitory.images.length > 1"
    @click="nextImage"
    class="absolute p-3 bg-white rounded-full right-4 top-1/2"
  >
    ›
  </button>

</div>

        <div
          v-else
          class="flex items-center justify-center h-[300px] text-gray-400"
        >
          ไม่มีรูปภาพ
        </div>

      </div>
    </div>

    <!-- MAIN -->
    <div class="max-w-6xl px-6 py-10 mx-auto">

      <!-- ROOMS -->
      <section class="mb-16">

        <h2 class="mb-6 text-2xl font-bold">ห้องพักทั้งหมด</h2>

        <div
          v-if="dormitory.rooms.length"
          class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >

          <div
            v-for="room in dormitory.rooms"
            :key="room.id"
            class="p-6 bg-white shadow rounded-2xl"
          >

            <div class="flex justify-between mb-3">
              <h3 class="font-semibold">
                ห้อง {{ room.roomNumber }}
              </h3>

              <span
                class="px-3 py-1 text-xs rounded-full"
                :class="room.status === 'AVAILABLE'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'"
              >
                {{ room.status === 'AVAILABLE' ? 'ว่าง' : 'ไม่ว่าง' }}
              </span>
            </div>

            <p class="text-2xl font-bold text-blue-600">
              {{ formatPrice(room.price) }} ฿
            </p>

            <button
              :disabled="!isMember || room.status !== 'AVAILABLE'"
              @click="requestRental(room.id)"
              class="w-full py-2 mt-4 text-white rounded-xl"
              :class="
                isMember && room.status === 'AVAILABLE'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400'
              "
            >
              ส่งคำขอเช่า
            </button>

          </div>

        </div>

      </section>


      <!-- REVIEW FORM -->
      <section v-if="isMember" class="mb-12">

        <div class="p-6 bg-white shadow rounded-2xl">

          <h3 class="mb-4 text-lg font-semibold">
            เขียนรีวิว
          </h3>

          <!-- stars -->
          <div class="flex mb-4 text-2xl text-yellow-400">

            <span
              v-for="n in 5"
              :key="n"
              class="cursor-pointer"
              @click="rating = n"
            >
              {{ n <= rating ? '★' : '☆' }}
            </span>

          </div>

          <textarea
            v-model="comment"
            placeholder="เขียนความคิดเห็น..."
            class="w-full p-3 border rounded-xl"
          ></textarea>

          <button
            @click="submitReview"
            class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-xl hover:bg-blue-700"
          >
            ส่งรีวิว
          </button>

        </div>

      </section>


      <!-- REVIEW LIST -->
      <section>

        <h2 class="mb-6 text-2xl font-bold">
          รีวิวจากผู้พัก
        </h2>

        <div
          v-if="dormitory.reviews.length"
          class="space-y-6"
        >

          <div
            v-for="review in dormitory.reviews"
            :key="review.id"
            class="p-6 bg-white shadow rounded-2xl"
          >

            <div class="flex justify-between mb-2">

              <p class="font-semibold">
                {{ review.user.username }}
              </p>

              <div class="text-yellow-400">
                <span v-for="n in 5" :key="n">
                  {{ n <= review.rating ? '★' : '☆' }}
                </span>
              </div>

            </div>

            <p class="text-gray-600">
              {{ review.comment }}
            </p>

          </div>

        </div>

        <div
          v-else
          class="p-10 text-center text-gray-500 bg-white rounded-xl"
        >
          ยังไม่มีรีวิว
        </div>

      </section>

    </div>

  </div>
</template>

<script setup lang="ts">

import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import api from "@/services/api"

const BASE_URL = import.meta.env.VITE_BACKEND_URL

const route = useRoute()
const router = useRouter()

const dormitory = ref<any>(null)
const currentUser = ref<any>(null)

const rating = ref(0)
const comment = ref("")

const currentImage = ref(0)

const isMember = computed(
  () => currentUser.value?.role === "MEMBER"
)

const averageRating = computed(() => {

  if (!dormitory.value?.reviews?.length) return 0

  const total = dormitory.value.reviews.reduce(
    (sum: number, r: any) => sum + r.rating,
    0
  )

  return total / dormitory.value.reviews.length

})

const fetchDormitory = async () => {

  const { data } = await api.get(
    `/dormitories/${route.params.id}`
  )

  dormitory.value = data

}

const submitReview = async () => {

  if (!rating.value) {
    alert("กรุณาให้คะแนน")
    return
  }

  try {

    await api.post("/reviews", {
      dormitoryId: dormitory.value.id,
      rating: rating.value,
      comment: comment.value
    })

    alert("รีวิวสำเร็จ")

    rating.value = 0
    comment.value = ""

    fetchDormitory()

  } catch (err: any) {

    alert(
      err.response?.data?.message ||
      "ไม่สามารถรีวิวได้"
    )

  }

}

const requestRental = async (roomId:number) => {

  try {

    await api.post("/rental/request", {
      roomId,
      userId: currentUser.value.id
    })

    alert("ส่งคำขอเช่าแล้ว")

  } catch {

    alert("ไม่สามารถส่งคำขอได้")

  }

}

const nextImage = () => {

  currentImage.value =
    (currentImage.value + 1) %
    dormitory.value.images.length

}

const prevImage = () => {

  currentImage.value =
    (currentImage.value - 1 +
      dormitory.value.images.length) %
    dormitory.value.images.length

}

const goBack = () => {

  router.back()

}

const formatPrice = (price:number) =>
  Number(price).toLocaleString()

onMounted(() => {

  const user = localStorage.getItem("user")

  if (user)
    currentUser.value = JSON.parse(user)

  fetchDormitory()

})

</script>