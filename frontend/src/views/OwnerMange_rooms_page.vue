<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <h1 class="mb-8 text-3xl font-bold">Manage Rooms</h1>

    <!-- ADD ROOM -->
    <div class="p-6 mb-8 bg-white shadow rounded-2xl">
      <h2 class="mb-4 text-lg font-semibold">Add New Room</h2>

      <div class="grid gap-4 md:grid-cols-7">

        <input v-model="form.roomNumber" placeholder="Room Number" class="input" />

        <input v-model="form.price" type="number" placeholder="Price" class="input" />

        <input v-model="form.size" type="number" placeholder="Size" class="input" />

        <input v-model="form.floor" type="number" placeholder="Floor" class="input" />

        <input v-model="form.capacity" type="number" placeholder="Capacity" class="input" />

        <!-- Upload -->
        <input
          type="file"
          accept="image/*"
          @change="handleFile"
          class="input"
        />

        <button @click="createRoom" class="btn-primary">
          Add
        </button>
      </div>

      <!-- Preview -->
      <div v-if="roomImage" class="mt-4">
        <img
  v-if="previewUrl"
  :src="previewUrl"
  class="object-cover w-32 h-32 rounded"
/>
      </div>

    </div>

    <!-- ROOM GRID -->
    <div class="p-8 bg-gradient-to-b from-black to-gray-900 rounded-3xl">

      <div
        v-for="(group, floor) in groupedRooms"
        :key="floor"
        class="flex items-center mb-10"
      >

        <div class="grid flex-1 grid-cols-8 gap-8">

          <div
            v-for="room in group"
            :key="room.id"
            class="relative flex flex-col items-center cursor-pointer"
          >

            <!-- ROOM CARD -->
            <div
              @click="openEdit(room)"
              class="flex items-center justify-center text-xl text-white bg-blue-500 shadow-lg w-14 h-14 rounded-xl"
            >
              🏠
            </div>

            <div class="mt-2 text-xs text-white">
              {{ room.roomNumber }}
            </div>

            <!-- IMAGE -->
            <img
              v-if="room.imageUrl"
              :src="room.imageUrl"
              class="object-cover w-12 h-12 mt-1 rounded"
            />

          </div>

        </div>

        <div class="w-12 text-2xl font-bold text-center text-white">
          {{ getFloorLabel(Number(floor)) }}
        </div>

      </div>

    </div>

    <!-- EDIT MODAL -->
    <div v-if="editingRoom" class="fixed inset-0 flex items-center justify-center bg-black/60">

      <div class="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">

        <h2 class="mb-6 text-xl font-bold">
          Edit Room {{ editingRoom.roomNumber }}
        </h2>

        <div class="space-y-4">

          <input v-model="editForm.roomNumber" class="input" />

          <input v-model="editForm.price" type="number" class="input" />

          <input v-model="editForm.size" type="number" class="input" />

          <input v-model="editForm.floor" type="number" class="input" />

          <input v-model="editForm.capacity" type="number" class="input" />

          <input
            type="file"
            accept="image/*"
            @change="handleEditFile"
            class="input"
          />

        </div>

        <div class="flex justify-end gap-3 mt-6">

          <button
            @click="editingRoom = null"
            class="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>

          <button
            @click="saveEdit"
            class="px-4 py-2 text-white bg-blue-600 rounded"
          >
            Save
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue"
import { useRoute } from "vue-router"
import api from "@/services/api"

/* ================= TYPES ================= */

interface Room {
  id: number
  roomNumber: string
  price: number
  size: number
  floor: number
  capacity: number
  status: string
  imageUrl?: string
}

/* ================= ROUTE ================= */

const route = useRoute()
const dormId = Number(route.params.id)

/* ================= STATE ================= */

const rooms = ref<Room[]>([])
const editingRoom = ref<Room | null>(null)

const roomImage = ref<File | null>(null)
const editImage = ref<File | null>(null)

/* ================= PREVIEW ================= */

const previewUrl = computed(() => {
  if (!roomImage.value) return null
  return URL.createObjectURL(roomImage.value)
})

/* ================= FORM ================= */

const form = reactive({
  roomNumber: "",
  price: "",
  size: "",
  floor: "",
  capacity: ""
})

const editForm = reactive({
  roomNumber: "",
  price: "",
  size: "",
  floor: "",
  capacity: ""
})

/* ================= FILE HANDLERS ================= */

const handleFile = (e: Event) => {
  const target = e.target as HTMLInputElement

  if (target.files && target.files.length > 0) {
    roomImage.value = target.files[0] as File
  }
}

const handleEditFile = (e: Event) => {
  const target = e.target as HTMLInputElement

  if (target.files && target.files.length > 0) {
    editImage.value = target.files[0] as File
  }
}

/* ================= FETCH ================= */

const fetchRooms = async () => {
  const { data } = await api.get(`/dormitories/rooms/${dormId}`)
  rooms.value = data
}

/* ================= CREATE ROOM ================= */

const createRoom = async () => {

  const formData = new FormData()

  formData.append("roomNumber", form.roomNumber)
  formData.append("price", form.price)
  formData.append("size", form.size)
  formData.append("floor", form.floor)
  formData.append("capacity", form.capacity)
  formData.append("dormitoryId", String(dormId))

  if (roomImage.value) {
    formData.append("image", roomImage.value)
  }

  await api.post("/dormitories/rooms", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })

  form.roomNumber = ""
  form.price = ""
  form.size = ""
  form.floor = ""
  form.capacity = ""
  roomImage.value = null

  fetchRooms()
}

/* ================= EDIT ================= */

const openEdit = (room: Room) => {

  editingRoom.value = room

  editForm.roomNumber = room.roomNumber
  editForm.price = String(room.price)
  editForm.size = String(room.size)
  editForm.floor = String(room.floor)
  editForm.capacity = String(room.capacity)
}

const saveEdit = async () => {

  if (!editingRoom.value) return

  const formData = new FormData()

  formData.append("roomNumber", editForm.roomNumber)
  formData.append("price", editForm.price)
  formData.append("size", editForm.size)
  formData.append("floor", editForm.floor)
  formData.append("capacity", editForm.capacity)

  if (editImage.value) {
    formData.append("image", editImage.value)
  }

  await api.patch(
    `/dormitories/rooms/${editingRoom.value.id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  )

  editingRoom.value = null
  editImage.value = null

  fetchRooms()
}

/* ================= GROUP ROOMS ================= */

const groupedRooms = computed(() => {

  const groups: Record<number, Room[]> = {}

  rooms.value.forEach(room => {

    if (!groups[room.floor]) {
      groups[room.floor] = []
    }

    groups[room.floor]!.push(room)

  })

  return groups
})

/* ================= FLOOR LABEL ================= */

const getFloorLabel = (floor: number) => {

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  return letters[floor - 1] || floor
}

/* ================= MOUNT ================= */

onMounted(() => {
  fetchRooms()
})
</script>

<style scoped>
.input{
  @apply border rounded px-3 py-2 w-full;
}

.btn-primary{
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
}
</style>