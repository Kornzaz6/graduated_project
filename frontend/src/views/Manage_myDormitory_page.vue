<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <h1 class="mb-6 text-2xl font-bold">My Dormitories</h1>

    <div v-if="loading" class="text-gray-500">
      Loading...
    </div>

    <div v-if="!loading && dormitories.length === 0" class="text-gray-500">
      No dormitories yet.
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div
        v-for="dorm in dormitories"
        :key="dorm.id"
        class="p-4 bg-white rounded-lg shadow"
      >
        <!-- Image -->
        <img
          v-if="dorm.images.length"
          :src="`http://localhost:5000${dorm.images[0].imageUrl}`"
          class="object-cover w-full h-40 mb-3 rounded"
        />

        <h2 class="text-lg font-semibold">
          {{ dorm.name }}
        </h2>

        <p class="text-sm text-gray-500">
          {{ dorm.address }}
        </p>

        <p class="mt-1 text-xs text-blue-600">
          Type: {{ dorm.type }}
        </p>

        <!-- Stats -->
        <div class="mt-4 space-y-1 text-sm text-gray-600">
          <p>Total Rooms: {{ dorm.rooms.length }}</p>
          <p>
            Available Rooms:
            {{
              dorm.rooms.filter((r: any) => r.status === "AVAILABLE")
            }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-4">
            <router-link
              :to="`/owner/edit-dormitory/${dorm.id}`"
              class="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">
                Edit
            </router-link>  

          <button
            @click="deleteDormitory(dorm.id)"
            class="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import api from "@/services/api"

const router = useRouter()

const dormitories = ref<any[]>([])
const loading = ref(true)

const user = JSON.parse(localStorage.getItem("user") || "null")

const fetchMyDormitories = async () => {
  if (!user?.id) {
    loading.value = false
    return
  }

  try {
    const { data } = await api.get(
      `/dormitories/owner/${user.id}`
    )

    dormitories.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Failed to fetch dormitories", error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchMyDormitories)

const editDormitory = (id: number) => {
  router.push(`/owner/edit-dormitory/${id}`)
}

const deleteDormitory = async (id: number) => {
  if (!confirm("Are you sure?")) return

  try {
    await api.delete(`/dormitories/${id}`)
    await fetchMyDormitories()
  } catch (error) {
    console.error("Delete failed", error)
  }
}
</script>