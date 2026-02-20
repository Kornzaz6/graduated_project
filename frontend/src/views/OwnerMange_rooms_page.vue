<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <h1 class="mb-6 text-2xl font-bold">Manage Rooms</h1>

    <!-- Add Room Form -->
    <div class="p-4 mb-6 bg-white rounded shadow">
      <h2 class="mb-4 font-semibold">Add New Room</h2>

      <div class="grid gap-3 md:grid-cols-3">
        <input v-model="form.roomNumber" placeholder="Room Number" class="input"/>
        <input v-model="form.price" type="number" placeholder="Price" class="input"/>
        <input v-model="form.size" type="number" placeholder="Size (sqm)" class="input"/>
        <input v-model="form.floor" type="number" placeholder="Floor" class="input"/>
        <input v-model="form.capacity" type="number" placeholder="Capacity" class="input"/>

        <button @click="createRoom" class="btn-primary">
          Add Room
        </button>
      </div>
    </div>

    <!-- Room List -->
    <div class="bg-white rounded shadow">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3">Room</th>
            <th class="px-4 py-3">Price</th>
            <th class="px-4 py-3">Size</th>
            <th class="px-4 py-3">Floor</th>
            <th class="px-4 py-3">Capacity</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody>
  <tr v-for="room in rooms" :key="room.id" class="border-t">
    
    <!-- Room Number -->
    <td class="px-4 py-2">
      <template v-if="editingRoomId === room.id">
        <input v-model="editForm.roomNumber" class="input"/>
      </template>
      <template v-else>
        {{ room.roomNumber }}
      </template>
    </td>

    <!-- Price -->
    <td class="px-4 py-2">
      <template v-if="editingRoomId === room.id">
        <input v-model="editForm.price" type="number" class="input"/>
      </template>
      <template v-else>
        {{ room.price }}
      </template>
    </td>

    <!-- Size -->
    <td class="px-4 py-2">
      <template v-if="editingRoomId === room.id">
        <input v-model="editForm.size" type="number" class="input"/>
      </template>
      <template v-else>
        {{ room.size }}
      </template>
    </td>

    <!-- Floor -->
    <td class="px-4 py-2">
      <template v-if="editingRoomId === room.id">
        <input v-model="editForm.floor" type="number" class="input"/>
      </template>
      <template v-else>
        {{ room.floor }}
      </template>
    </td>

    <!-- Capacity -->
    <td class="px-4 py-2">
      <template v-if="editingRoomId === room.id">
        <input v-model="editForm.capacity" type="number" class="input"/>
      </template>
      <template v-else>
        {{ room.capacity }}
      </template>
    </td>

    <!-- Status -->
    <td class="px-4 py-2">
      <span
        class="px-2 py-1 text-xs rounded"
        :class="room.status === 'AVAILABLE'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'"
      >
        {{ room.status }}
      </span>
    </td>

    <!-- Actions -->
    <td class="flex gap-2 px-4 py-2">

      <!-- Editing Mode -->
      <template v-if="editingRoomId === room.id">
        <button
          @click="saveEdit(room.id)"
          class="text-green-600"
        >
          Save
        </button>

        <button
          @click="editingRoomId = null"
          class="text-gray-500"
        >
          Cancel
        </button>
      </template>

      <!-- Normal Mode -->
      <template v-else>
        <button
          @click="startEdit(room)"
          class="text-blue-600"
        >
          Edit
        </button>

        <button
          @click="toggleStatus(room)"
          class="text-purple-600"
        >
          Toggle
        </button>

        <button
          @click="deleteRoom(room.id)"
          class="text-red-600"
        >
          Delete
        </button>
      </template>

    </td>
  </tr>
</tbody>

      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const rooms = ref<any[]>([]);
const loading = ref(false);

// ✅ ใช้ param id ให้ตรงกับ route
const dormId = Number(route.params.id);

const form = reactive({
  roomNumber: "",
  price: "",
  size: "",
  floor: "",
  capacity: "",
});

const editingRoomId = ref<number | null>(null);
const editForm = reactive({
  roomNumber: "",
  price: "",
  size: "",
  floor: "",
  capacity: "",
});

const startEdit = (room: any) => {
  editingRoomId.value = room.id;

  editForm.roomNumber = room.roomNumber;
  editForm.price = room.price;
  editForm.size = room.size;
  editForm.floor = room.floor;
  editForm.capacity = room.capacity;
};

const saveEdit = async (id: number) => {
  try {
    await fetch(`http://localhost:5000/api/dormitories/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomNumber: editForm.roomNumber,
        price: Number(editForm.price),
        size: Number(editForm.size),
        floor: Number(editForm.floor),
        capacity: Number(editForm.capacity),
      }),
    });

    editingRoomId.value = null;
    fetchRooms();
  } catch (err) {
    alert("Failed to update room");
  }
};



// ============================
// FETCH ROOMS
// ============================
const fetchRooms = async () => {
  try {
    loading.value = true;

    const res = await fetch(
      `http://localhost:5000/api/dormitories/rooms/${dormId}`
    );

    if (!res.ok) throw new Error("Failed to fetch rooms");

    rooms.value = await res.json();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// ============================
// CREATE ROOM
// ============================
const createRoom = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/dormitories/rooms",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dormitoryId: dormId,
        }),
      }
    );

    if (!res.ok) throw new Error("Create failed");

    // reset form
    form.roomNumber = "";
    form.price = "";
    form.size = "";
    form.floor = "";
    form.capacity = "";

    fetchRooms();
  } catch (err) {
    alert("Failed to create room");
  }
};

// ============================
// DELETE ROOM
// ============================
const deleteRoom = async (id: number) => {
  if (!confirm("Delete this room?")) return;

  await fetch(
    `http://localhost:5000/api/dormitories/rooms/${id}`,
    { method: "DELETE" }
  );

  fetchRooms();
};

// ============================
// TOGGLE STATUS
// ============================
const toggleStatus = async (room: any) => {
  await fetch(
    `http://localhost:5000/api/dormitories/rooms/${room.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: room.status === "AVAILABLE"
          ? "OCCUPIED"
          : "AVAILABLE",
      }),
    }
  );

  fetchRooms();
};

// ============================
// ON MOUNT
// ============================
onMounted(() => {
  if (!dormId || isNaN(dormId)) {
    router.push("/owner/manage-dormitory");
    return;
  }

  fetchRooms();
});
</script>


<style scoped>
.input {
  @apply border rounded px-3 py-2 w-full;
}

.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700;
}
</style>
