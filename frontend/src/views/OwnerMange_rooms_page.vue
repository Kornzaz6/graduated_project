<template>
  <div class="min-h-screen p-8 bg-gray-100">
    <h1 class="mb-8 text-3xl font-bold">Manage Rooms</h1>

    <!-- ADD ROOM -->
    <div class="p-6 mb-8 bg-white shadow rounded-2xl">
      <h2 class="mb-4 text-lg font-semibold">Add New Room</h2>

      <div class="grid gap-4 md:grid-cols-6">
        <input v-model="form.roomNumber" placeholder="Room Number" class="input" />

        <input v-model="form.price" type="number" placeholder="Price" class="input" />

        <input v-model="form.size" type="number" placeholder="Size" class="input" />

        <input v-model="form.floor" type="number" placeholder="Floor" class="input" />

        <input v-model="form.capacity" type="number" placeholder="Capacity" class="input" />

        <button @click="createRoom" class="btn-primary">Add</button>
      </div>

      <!-- IMAGE UPLOAD -->
      <div class="mt-4">
        <input type="file" accept="image/*" @change="handleFile" />

        <!-- PREVIEW -->
        <div v-if="previewUrl" class="mt-3">
          <img :src="previewUrl" class="object-cover w-32 h-32 rounded" />
        </div>
      </div>
    </div>

    <!-- BULK ACTION BAR -->
    <div
      v-if="selectedRooms.length > 0"
      class="flex items-center justify-between p-4 mb-6 text-white bg-blue-600 rounded-2xl"
    >
      <div>Selected {{ selectedRooms.length }} rooms</div>

      <div class="flex gap-3">
        <button
          @click="bulkChangeStatus('AVAILABLE')"
          class="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
        >
          Set Available
        </button>

        <button
          @click="bulkChangeStatus('OCCUPIED')"
          class="px-4 py-2 bg-red-500 rounded hover:bg-red-600"
        >
          Set Occupied
        </button>

        <div class="flex items-center gap-2">
          <input
            v-model="bulkFloor"
            type="number"
            placeholder="Floor"
            class="w-20 px-2 py-1 text-black rounded"
          />

          <button @click="bulkSetFloor" class="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600">
            Set Floor
          </button>
        </div>

        <button @click="clearSelection" class="px-4 py-2 bg-gray-800 rounded hover:bg-gray-900">
          Clear
        </button>
      </div>
    </div>

    <!-- ROOM GRID -->
    <!-- ROOM GRID -->
<div class="p-8 bg-gradient-to-b from-black to-gray-900 rounded-3xl">

  <div class="flex items-center justify-between mb-8 text-white">

    <div class="flex items-center gap-6">

      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-green-500 rounded"></div>
        <span class="text-sm">Available</span>
      </div>

      <div class="flex items-center gap-2">
        <div class="w-4 h-4 bg-red-500 rounded"></div>
        <span class="text-sm">Occupied</span>
      </div>

    </div>

    <button
      @click="selectAll"
      class="px-3 py-1 text-sm rounded bg-white/20 hover:bg-white/30"
    >
      Select All
    </button>

  </div>


  <!-- FLOORS -->
  <div
    v-for="(group, floor) in groupedRooms"
    :key="floor"
    class="flex items-center mb-10"
  >

    <div class="grid flex-1 grid-cols-8 gap-8">

      <div
        v-for="room in group"
        :key="room.id"
        class="relative flex flex-col items-center transition cursor-pointer hover:scale-110"
      >

        <!-- CUSTOM CHECKBOX -->
        <label
          class="absolute z-20 flex items-center justify-center w-5 h-5 bg-white border rounded shadow cursor-pointer top-1 left-1"
        >

          <input
            type="checkbox"
            class="hidden"
            :checked="selectedRooms.includes(room.id)"
            @change="toggleSelect(room.id)"
          />

          <span
            v-if="selectedRooms.includes(room.id)"
            class="text-xs font-bold text-black"
          >
            ✓
          </span>

        </label>


        <!-- ROOM CARD -->
        <div
          @click="openEdit(room)"
          class="flex items-center justify-center w-20 h-20 overflow-hidden text-xl transition-all duration-200 rounded-xl"
          :class="[

            room.status === 'AVAILABLE'
              ? 'bg-green-500 shadow-green-500/40'
              : 'bg-red-500 shadow-red-500/40',

            selectedRooms.includes(room.id)
              ? 'ring-4 ring-yellow-400 scale-105'
              : '',

            'shadow-lg'

          ]"
        >

          <!-- ROOM IMAGE -->
          <img
            v-if="room.imageUrl"
            :src="room.imageUrl"
            class="object-cover w-full h-full"
          />

          <!-- DEFAULT ICON -->
          <span v-else>🏠</span>

        </div>

        <!-- ROOM NUMBER -->
        <div class="mt-2 text-xs text-white">
          {{ room.roomNumber }}
        </div>

      </div>

    </div>


    <!-- FLOOR LABEL -->
    <div class="w-12 text-2xl font-bold text-center text-white">
      {{ getFloorLabel(Number(floor)) }}
    </div>

  </div>

</div>

    <!-- EDIT MODAL -->
    <div v-if="editingRoom" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h2 class="mb-6 text-xl font-bold text-gray-800">Edit Room {{ editingRoom.roomNumber }}</h2>

        <div class="space-y-5">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Room Number </label>
            <input v-model="editForm.roomNumber" class="input" />
          </div>

          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Monthly Price </label>
            <input v-model="editForm.price" type="number" class="input" />
          </div>

          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Room Size </label>
            <input v-model="editForm.size" type="number" class="input" />
          </div>

          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Floor </label>
            <input v-model="editForm.floor" type="number" class="input" />
          </div>

          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Capacity </label>
            <input v-model="editForm.capacity" type="number" class="input" />
          </div>

          <!-- EDIT IMAGE -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Room Image </label>

            <input type="file" accept="image/*" @change="handleEditFile" />

            <img
              v-if="editingRoom.imageUrl"
              :src="editingRoom.imageUrl"
              class="object-cover w-32 h-32 mt-2 rounded"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button
            @click="editingRoom = null"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button @click="saveEdit" class="px-5 py-2 text-white bg-blue-600 rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

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

const selectedRooms = ref<number[]>([])
const bulkFloor = ref<number | null>(null)

/* ================= PREVIEW ================= */

const previewUrl = computed(() => {
  if (!roomImage.value) return null
  return URL.createObjectURL(roomImage.value)
})

watch(roomImage, (file, oldFile) => {
  if (oldFile) {
    URL.revokeObjectURL(URL.createObjectURL(oldFile))
  }
})

/* ================= FORM ================= */

const form = reactive({
  roomNumber: '',
  price: '',
  size: '',
  floor: '',
  capacity: '',
})

const editForm = reactive({
  roomNumber: '',
  price: '',
  size: '',
  floor: '',
  capacity: '',
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

/* ================= FETCH ROOMS ================= */

const fetchRooms = async () => {
  try {
    const { data } = await api.get(`/dormitories/rooms/${dormId}`)

    rooms.value = data
  } catch (err) {
    console.error('Fetch rooms error', err)
  }
}

/* ================= CREATE ROOM ================= */

const createRoom = async () => {
  try {
    const formData = new FormData()

    formData.append('roomNumber', form.roomNumber)
    formData.append('price', form.price)
    formData.append('size', form.size)
    formData.append('floor', form.floor)
    formData.append('capacity', form.capacity)
    formData.append('dormitoryId', String(dormId))

    if (roomImage.value) {
      formData.append('image', roomImage.value)
    }

    await api.post('/dormitories/rooms', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    form.roomNumber = ''
    form.price = ''
    form.size = ''
    form.floor = ''
    form.capacity = ''
    roomImage.value = null

    fetchRooms()
  } catch (err) {
    console.error('Create room error', err)
  }
}

/* ================= EDIT ROOM ================= */

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

  try {
    const formData = new FormData()

    formData.append('roomNumber', editForm.roomNumber)
    formData.append('price', editForm.price)
    formData.append('size', editForm.size)
    formData.append('floor', editForm.floor)
    formData.append('capacity', editForm.capacity)

    if (editImage.value) {
      formData.append('image', editImage.value)
    }

    await api.patch(`/dormitories/rooms/${editingRoom.value.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    editingRoom.value = null
    editImage.value = null

    fetchRooms()
  } catch (err) {
    console.error('Update room error', err)
  }
}

/* ================= GROUP ROOMS ================= */

const groupedRooms = computed(() => {
  const groups: Record<number, Room[]> = {}

  const sortedRooms = [...rooms.value].sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  sortedRooms.forEach((room) => {
    if (!groups[room.floor]) {
      groups[room.floor] = []
    }
    groups[room.floor]!.push(room)
  })

  return groups
})

/* ================= FLOOR LABEL ================= */

const getFloorLabel = (floor: number) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return letters[floor - 1] || floor
}

/* ================= SELECTION ================= */

const toggleSelect = (id: number) => {
  if (selectedRooms.value.includes(id)) {
    selectedRooms.value = selectedRooms.value.filter((r) => r !== id)
  } else {
    selectedRooms.value.push(id)
  }
}

const selectAll = () => {
  selectedRooms.value = rooms.value.map((r) => r.id)
}

const clearSelection = () => {
  selectedRooms.value = []
}

/* ================= BULK ACTIONS ================= */

const bulkChangeStatus = async (status: string) => {
  await Promise.all(
    selectedRooms.value.map((id) => api.patch(`/dormitories/rooms/${id}`, { status }))
  )

  clearSelection()
  fetchRooms()
}

const bulkSetFloor = async () => {
  if (!bulkFloor.value) return

  await Promise.all(
    selectedRooms.value.map((id) =>
      api.patch(`/dormitories/rooms/${id}`, {
        floor: bulkFloor.value,
      })
    )
  )

  bulkFloor.value = null
  clearSelection()
  fetchRooms()
}

/* ================= MOUNT ================= */

onMounted(() => {
  if (!dormId || isNaN(dormId)) {
    console.error('Invalid dormitory id')
    return
  }

  fetchRooms()
})
</script>

<style scoped>
.input {
  @apply border rounded px-3 py-2 w-full;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
}
</style>