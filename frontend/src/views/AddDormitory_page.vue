<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <div class="max-w-2xl p-6 mx-auto space-y-4 bg-white rounded shadow">

      <h2 class="text-xl font-bold">Add Dormitory</h2>

      <input
        v-model="form.name"
        placeholder="Dormitory Name"
        class="w-full p-2 border rounded"
      />

      <select v-model="form.type" class="w-full p-2 border rounded">
        <option value="">Select Type</option>
        <option>Male</option>
        <option>Female</option>
        <option>Mixed</option>
      </select>

      <input
        v-model="form.location"
        placeholder="Location (auto from map)"
        class="w-full p-2 border rounded"
      />

      <input
        type="number"
        v-model="form.latitude"
        placeholder="Latitude"
        class="w-full p-2 border rounded"
      />

      <input
  v-model="form.address"
  placeholder="Address"
  class="w-full p-2 border rounded"
/>


      <input
        type="number"
        v-model="form.longitude"
        placeholder="Longitude"
        class="w-full p-2 border rounded"
      />

      <input
        type="number"
        v-model="form.roomCount"
        min="1"
        placeholder="Number of Rooms"
        class="w-full p-2 border rounded"
      />

      <div id="map" class="h-64 rounded"></div>

      <button
        @click="submitDormitory"
        class="px-4 py-2 text-white bg-blue-600 rounded"
      >
        Create Dormitory
      </button>

    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import L from "leaflet";

// ---------- GET CURRENT USER ----------
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

if (!currentUser || currentUser.role !== "OWNER") {
  alert("Access denied. Only owners can create dormitories.");
}

// ---------- FORM STATE ----------
const form = reactive({
  name: "",
  type: "",
  address: "",
  location: "",
  latitude: null as number | null,
  longitude: null as number | null,
  roomCount: 1,
});

const isLoadingAddress = ref(false);

// ---------- MAP ----------
let map: L.Map;
let marker: L.Marker | null = null;

onMounted(() => {
  map = L.map("map").setView([13.7367, 100.5231], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  map.on("click", async (e: any) => {
    const { lat, lng } = e.latlng;

    form.latitude = Number(lat.toFixed(8));
    form.longitude = Number(lng.toFixed(8));

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng]).addTo(map);
    }

    await reverseGeocode(lat, lng);
  });
});

// ---------- REVERSE GEOCODE ----------
const reverseGeocode = async (lat: number, lng: number) => {
  try {
    isLoadingAddress.value = true;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();

    form.location = data.display_name || "";

    const addr = data.address || {};

    form.address = [
      addr.road,
      addr.suburb || addr.village,
      addr.city || addr.town,
      addr.state,
    ]
      .filter(Boolean)
      .join(", ");

  } catch (error) {
    console.error("Reverse geocode error:", error);
  } finally {
    isLoadingAddress.value = false;
  }
};

// ---------- SUBMIT ----------
const submitDormitory = async () => {
  try {
    if (!form.name || !form.type || !form.address) {
      alert("Please complete all required fields");
      return;
    }

    const response = await fetch("http://localhost:5000/api/dormitories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        userId: currentUser.id, // ✅ ส่ง userId แทน ownerId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create dormitory");
    }

    alert("Dormitory created successfully!");

    // Reset form
    form.name = "";
    form.type = "";
    form.address = "";
    form.location = "";
    form.latitude = null;
    form.longitude = null;
    form.roomCount = 1;

    if (marker) {
      map.removeLayer(marker);
      marker = null;
    }

  } catch (error: any) {
    console.error("Create error:", error);
    alert(error.message);
  }
};
</script>

