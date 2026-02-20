<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">
      Owner Dashboard
    </h1>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
      <div class="p-4 bg-white rounded shadow">
        <p class="text-sm text-gray-500">Total Dormitories</p>
        <p class="text-2xl font-bold text-blue-600">
          {{ dormitories.length }}
        </p>
      </div>

      <div class="p-4 bg-white rounded shadow">
        <p class="text-sm text-gray-500">Total Rooms</p>
        <p class="text-2xl font-bold text-green-600">
          {{ totalRooms }}
        </p>
      </div>
    </div>

    <!-- Dormitory List -->
    <div class="bg-white rounded shadow">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">
          My Dormitories
        </h2>
      </div>

      <div class="p-4 space-y-4">
        <div
          v-for="dorm in dormitories"
          :key="dorm.id"
          class="p-4 border rounded hover:bg-gray-50"
        >
          <h3 class="text-lg font-semibold">
            {{ dorm.name }}
          </h3>

          <p class="text-sm text-gray-500">
            {{ dorm.address }}
          </p>

          <p class="mt-1 text-sm">
            Rooms: {{ dorm.rooms.length }}
          </p>
        </div>

        <p v-if="dormitories.length === 0" class="text-gray-500">
          No dormitories yet.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

const dormitories = ref<any[]>([]);

const currentUser = JSON.parse(localStorage.getItem("user") || "null");

const fetchDormitories = async () => {
  if (!currentUser?.owner?.id) return;

  const response = await fetch(
    `http://localhost:5000/api/dormitories/owner/${currentUser.owner.id}`
  );

  const data = await response.json();
  dormitories.value = data;
};

onMounted(() => {
  fetchDormitories();
});

const totalRooms = computed(() =>
  dormitories.value.reduce((sum, dorm) => sum + dorm.rooms.length, 0)
);
</script>
