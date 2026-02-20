<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="p-4 bg-white shadow">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            Dormitory Hub
          </h1>
          <p class="text-sm text-gray-500">
            Find dormitories near the university
          </p>
        </div>

        <!-- Search Bar -->
<div class="flex w-full gap-2 md:w-2/3">
  <input
    v-model="searchQuery"
    @keyup.enter="fetchDormitories"
    placeholder="Search dormitory name or address..."
    class="flex-1 px-3 py-2 border rounded"
  />

  <select
    v-model="selectedType"
    class="px-3 py-2 border rounded"
  >
    <option value="">All Types</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
    <option value="Mixed">Mixed</option>
  </select>

  <button
  @click="handleManualSearch"
  class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
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
        <h2 class="mb-4 text-lg font-semibold">
          Dormitory List
        </h2>

        <div
          v-for="dorm in dormitories"
          :key="dorm.id"
          class="p-3 mb-3 border rounded cursor-pointer hover:bg-gray-50"
          @click="focusDormitory(dorm)"
        >
          <h3 class="font-medium text-gray-800">
            {{ dorm.name }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ dorm.address }}
          </p>
          <p class="mt-1 text-xs text-blue-600">
            Type: {{ dorm.type }}
          </p>
        </div>

        <p
          v-if="dormitories.length === 0 && !loading"
          class="mt-6 text-center text-gray-500"
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
import { onMounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png"; 
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const searchQuery = ref("");
const selectedType = ref("");
const dormitories = ref<any[]>([]);
const loading = ref(false);

let map: L.Map;
let markers: L.Marker[] = [];
let debounceTimer: any = null;

onMounted(async () => {
  map = L.map("map").setView([13.7367, 100.5231], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  await fetchDormitories();
});

// 🔥 Fetch from backend
const fetchDormitories = async () => {
  try {
    loading.value = true;

    const params = new URLSearchParams();

    if (searchQuery.value.trim()) {
      params.append("search", searchQuery.value);
    }

    if (selectedType.value) {
      params.append("type", selectedType.value);
    }

    const response = await fetch(
      `http://localhost:5000/api/dormitories?${params.toString()}`
    );

    const data = await response.json();
    dormitories.value = data;

    updateMarkers(dormitories.value);
  } catch (error) {
    console.error("Failed to fetch dormitories", error);
  } finally {
    loading.value = false;
  }
};

// 🔥 Debounce Search
watch([searchQuery, selectedType], () => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    fetchDormitories();
  }, 500);
});

// 🔥 Update markers + auto zoom
const updateMarkers = (dorms: any[]) => {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  const latlngs: L.LatLngExpression[] = [];

  dorms.forEach((dorm) => {
    if (!dorm.latitude || !dorm.longitude) return;

    const latlng: L.LatLngExpression = [
      dorm.latitude,
      dorm.longitude,
    ];

    const marker = L.marker(latlng)
      .addTo(map)
      .bindPopup(
        `<b>${dorm.name}</b><br/>${dorm.address}<br/>Type: ${dorm.type}`
      );

    markers.push(marker);
    latlngs.push(latlng);
  });

  if (latlngs.length > 1) {
    map.fitBounds(latlngs);
  } else if (latlngs.length === 1) {
    map.setView(latlngs[0], 16);
  }
};

// click dormitory
const focusDormitory = (dorm: any) => {
  if (!dorm.latitude || !dorm.longitude) return;
  map.setView([dorm.latitude, dorm.longitude], 17);
};

// ปุ่ม Search ยังใช้ได้
const handleManualSearch = () => {
  fetchDormitories();
};
</script>

