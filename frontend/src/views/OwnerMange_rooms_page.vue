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

        <!-- Set Floor -->
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
    <div class="p-8 bg-gradient-to-b from-black to-gray-900 rounded-3xl">
      <!-- Legend + Select All -->
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

        <button @click="selectAll" class="px-3 py-1 text-sm rounded bg-white/20 hover:bg-white/30">
          Select All
        </button>
      </div>

      <!-- Floors -->
      <div v-for="(group, floor) in groupedRooms" :key="floor" class="flex items-center mb-10">
        <!-- Rooms -->
        <div class="grid flex-1 grid-cols-8 gap-8">
          <div
            v-for="room in group"
            :key="room.id"
            class="relative flex flex-col items-center transition cursor-pointer hover:scale-110"
          >
            <!-- Checkbox -->
            <input
              type="checkbox"
              class="absolute w-4 h-4 top-1 left-1"
              :checked="selectedRooms.includes(room.id)"
              @change="toggleSelect(room.id)"
            />

            <!-- Room Card -->
            <div
              @click="openEdit(room)"
              class="flex items-center justify-center text-xl transition-all w-14 h-14 rounded-xl"
              :class="[
                room.status === 'AVAILABLE'
                  ? 'bg-green-500 shadow-green-500/40'
                  : 'bg-red-500 shadow-red-500/40',
                selectedRooms.includes(room.id) ? 'ring-4 ring-yellow-400' : '',
                'shadow-lg',
              ]"
            >
              🏠
            </div>

            <div class="mt-2 text-xs text-white">
              {{ room.roomNumber }}
            </div>
          </div>
        </div>

        <!-- Floor Label -->
        <div class="w-12 text-2xl font-bold text-center text-white">
          {{ getFloorLabel(Number(floor)) }}
        </div>
      </div>
    </div>

    <!-- EDIT MODAL -->
    <!-- EDIT MODAL -->
    <div v-if="editingRoom" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h2 class="mb-6 text-xl font-bold text-gray-800">Edit Room {{ editingRoom.roomNumber }}</h2>

        <div class="space-y-5">
          <!-- Room Number -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Room Number </label>
            <input v-model="editForm.roomNumber" placeholder="เช่น 101, A12" class="input" />
          </div>

          <!-- Price -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600">
              Monthly Price (บาท)
            </label>
            <input v-model="editForm.price" type="number" placeholder="เช่น 3500" class="input" />
          </div>

          <!-- Size -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Room Size (sqm) </label>
            <input v-model="editForm.size" type="number" placeholder="เช่น 28" class="input" />
          </div>

          <!-- Floor -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Floor </label>
            <input
              v-model="editForm.floor"
              type="number"
              placeholder="เช่น 1, 2, 3"
              class="input"
            />
          </div>

          <!-- Capacity -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-600"> Capacity (คน) </label>
            <input
              v-model="editForm.capacity"
              type="number"
              placeholder="จำนวนผู้เข้าพัก"
              class="input"
            />
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="flex justify-end gap-3 mt-8">
          <button
            @click="editingRoom = null"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            @click="saveEdit"
            class="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

/* =====================================================
   TYPES
===================================================== */
interface Room {
  id: number
  roomNumber: string
  price: number
  size: number
  floor: number
  capacity: number
  status: string
}

/* =====================================================
   ROUTER
===================================================== */
const route = useRoute()
const router = useRouter()
const dormId = Number(route.params.id)

/* =====================================================
   STATE
===================================================== */
const rooms = ref<Room[]>([])
const loading = ref(false)
const bulkFloor = ref<number | null>(null)
const selectedRooms = ref<number[]>([])
const editingRoom = ref<Room | null>(null)

/* =====================================================
   SELECTION
===================================================== */
const isSelected = (id: number) =>
  selectedRooms.value.includes(id)

const toggleSelect = (id: number) => {
  if (isSelected(id)) {
    selectedRooms.value = selectedRooms.value.filter(r => r !== id)
  } else {
    selectedRooms.value.push(id)
  }
}

const selectAll = () => {
  selectedRooms.value = rooms.value.map(r => r.id)
}

const clearSelection = () => {
  selectedRooms.value = []
}

/* =====================================================
   GROUP ROOMS BY FLOOR
===================================================== */
const groupedRooms = computed(() => {
  const groups: Record<number, Room[]> = {}

  const sorted = [...rooms.value].sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  for (const room of sorted) {
    if (!groups[room.floor]) {
      groups[room.floor] = []
    }
    groups[room.floor]!.push(room)
  }

  return groups
})

const getFloorLabel = (floor: number) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return letters[floor - 1] || floor
}

/* =====================================================
   ADD FORM
===================================================== */
const form = reactive({
  roomNumber: '',
  price: '',
  size: '',
  floor: '',
  capacity: '',
})

/* =====================================================
   EDIT FORM
===================================================== */
const editForm = reactive({
  roomNumber: '',
  price: '',
  size: '',
  floor: '',
  capacity: '',
})

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

  await updateRoom(editingRoom.value.id, {
    roomNumber: editForm.roomNumber,
    price: Number(editForm.price),
    size: Number(editForm.size),
    floor: Number(editForm.floor),
    capacity: Number(editForm.capacity),
  })

  editingRoom.value = null
}

/* =====================================================
   API CALLS (AXIOS)
===================================================== */
const fetchRooms = async () => {
  try {
    loading.value = true
    const { data } = await api.get(`/dormitories/rooms/${dormId}`)
    rooms.value = data
  } catch (err) {
    console.error('Fetch rooms error:', err)
  } finally {
    loading.value = false
  }
}

const createRoom = async () => {
  await api.post('/dormitories/rooms', {
    roomNumber: form.roomNumber,
    price: Number(form.price),
    size: Number(form.size),
    floor: Number(form.floor),
    capacity: Number(form.capacity),
    dormitoryId: dormId,
  })

  form.roomNumber = ''
  form.price = ''
  form.size = ''
  form.floor = ''
  form.capacity = ''

  await fetchRooms()
}

const updateRoom = async (id: number, payload: Partial<Room>) => {
  await api.patch(`/dormitories/rooms/${id}`, payload)
  await fetchRooms()
}

const deleteRoom = async (id: number) => {
  if (!confirm('Delete this room?')) return
  await api.delete(`/dormitories/rooms/${id}`)
  await fetchRooms()
}

/* =====================================================
   BULK ACTIONS
===================================================== */
const bulkChangeStatus = async (status: string) => {
  if (!selectedRooms.value.length) return

  await Promise.all(
    selectedRooms.value.map(id =>
      api.patch(`/dormitories/rooms/${id}`, { status })
    )
  )

  clearSelection()
  await fetchRooms()
}

const bulkSetFloor = async () => {
  if (!bulkFloor.value || !selectedRooms.value.length) return

  await Promise.all(
    selectedRooms.value.map(id =>
      api.patch(`/dormitories/rooms/${id}`, {
        floor: bulkFloor.value,
      })
    )
  )

  bulkFloor.value = null
  clearSelection()
  await fetchRooms()
}

/* =====================================================
   MOUNT
===================================================== */
onMounted(() => {
  if (!dormId || isNaN(dormId)) {
    router.push('/owner/manage-dormitory')
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
