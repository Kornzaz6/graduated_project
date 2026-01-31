<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-white shadow p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            Dormitory Hub
          </h1>
          <p class="text-sm text-gray-500">
            Find dormitories near the university
          </p>
        </div>

        <!-- Search Bar -->
        <div class="flex gap-2 w-full md:w-1/2">
          <input
            v-model="searchQuery"
            @keyup.enter="searchDormitory"
            placeholder="Search dormitory name or address..."
            class="flex-1 border rounded px-3 py-2"
          />
          <button
            @click="searchDormitory"
            class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex flex-col md:flex-row">
      <!-- Dormitory List -->
      <div class="md:w-1/3 bg-white p-4 overflow-y-auto h-[calc(100vh-100px)]">
        <h2 class="text-lg font-semibold mb-4">
          Dormitory List
        </h2>

        <div
          v-for="dorm in filteredDormitories"
          :key="dorm.id"
          class="border rounded p-3 mb-3 hover:bg-gray-50 cursor-pointer"
          @click="focusDormitory(dorm)"
        >
          <h3 class="font-medium text-gray-800">
            {{ dorm.name }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ dorm.address }}
          </p>
          <p class="text-xs text-blue-600 mt-1">
            Type: {{ dorm.type }}
          </p>
        </div>

        <p
          v-if="filteredDormitories.length === 0"
          class="text-center text-gray-500 mt-6"
        >
          No dormitory found
        </p>
      </div>

      <!-- Map -->
      <div class="md:w-2/3 h-[calc(100vh-100px)]">
        <div id="map" class="w-full h-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import L from "leaflet";

// fix marker icon path (สำคัญสำหรับ Vite)
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// search
const searchQuery = ref("");

// mock dormitory data (แทน DB)
const dormitories = ref([
  {
    id: 1,
    name: "Sunshine Dormitory",
    address: "Near University Gate 1",
    type: "Mixed",
    lat: 13.736717,
    lng: 100.523186,
  },
  {
    id: 2,
    name: "Female Residence",
    address: "Opposite Faculty of Science",
    type: "Female",
    lat: 13.7375,
    lng: 100.5205,
  },
  {
    id: 3,
    name: "Male Dormitory",
    address: "Behind Engineering Building",
    type: "Male",
    lat: 13.7359,
    lng: 100.5262,
  },
]);

// filter list by search
const filteredDormitories = computed(() => {
  if (!searchQuery.value) return dormitories.value;

  return dormitories.value.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    d.address.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

let map: L.Map;
const markers: Record<number, L.Marker> = {};

onMounted(() => {
  // center map (university)
  map = L.map("map").setView([13.7367, 100.5231], 15);

  // OpenStreetMap tile
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // add markers
  dormitories.value.forEach((dorm) => {
    const marker = L.marker([dorm.lat, dorm.lng])
      .addTo(map)
      .bindPopup(
        `<b>${dorm.name}</b><br/>${dorm.address}<br/>Type: ${dorm.type}`
      );

    markers[dorm.id] = marker;
  });
});

// click dormitory → focus marker
const focusDormitory = (dorm: any) => {
  map.setView([dorm.lat, dorm.lng], 17);
  markers[dorm.id].openPopup();
};

// search → focus first match
const searchDormitory = () => {
  if (!searchQuery.value) return;

  const dorm = dormitories.value.find((d) =>
    d.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    d.address.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  if (dorm) {
    focusDormitory(dorm);
  } else {
    alert("Dormitory not found");
  }
};
</script>

<style scoped>
#map {
  z-index: 0;
}
</style>
