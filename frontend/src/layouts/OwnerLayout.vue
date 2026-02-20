<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="transition-all duration-300 bg-white shadow-md"
      :class="sidebarOpen ? 'w-64' : 'w-16'"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <span v-if="sidebarOpen" class="text-lg font-bold text-blue-600">
          Owner Panel
        </span>
        <button @click="toggleSidebar" class="text-gray-600 hover:text-blue-600">
          ☰
        </button>
      </div>

      <!-- User Profile -->
      <div
        v-if="currentUser"
        class="flex items-center gap-3 p-4 border-b"
      >
        <div
          class="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full"
        >
          {{ currentUser.firstName?.charAt(0) || currentUser.username?.charAt(0) }}
        </div>

        <div v-if="sidebarOpen" class="flex flex-col">
          <span class="text-sm font-semibold">
            {{ currentUser.firstName }} {{ currentUser.lastName }}
          </span>

          <span
            class="px-2 py-0.5 text-xs rounded w-fit"
            :class="{
              'bg-blue-100 text-blue-700': currentUser.role === 'OWNER'
            }"
          >
            {{ currentUser.role }}
          </span>
        </div>
      </div>

      <!-- Menu -->
      <nav class="p-4 space-y-2">
        <router-link
          to="/owner/dashboard"
          class="flex items-center px-3 py-2 rounded hover:bg-blue-100"
          :class="isActive('/owner/dashboard')"
        >
          <span>📊</span>
          <span v-if="sidebarOpen" class="ml-2">Dashboard</span>
        </router-link>

        <router-link
          to="/owner/manage-dormitory"
          class="flex items-center px-3 py-2 rounded hover:bg-blue-100"
          :class="isActive('/owner/manage-dormitory')"
        >
          <span>🏢</span>
          <span v-if="sidebarOpen" class="ml-2">Manage Dormitories</span>
        </router-link>

        <router-link
          to="/owner/add-dormitory"
          class="flex items-center px-3 py-2 rounded hover:bg-blue-100"
          :class="isActive('/owner/add-dormitory')"
        >
          <span>➕</span>
          <span v-if="sidebarOpen" class="ml-2">Add Dormitory</span>
        </router-link>
      </nav>

      <!-- Logout -->
      <div class="absolute bottom-0 w-full p-4 border-t">
        <button
          @click="handleLogout"
          class="w-full px-4 py-2 text-left text-red-600 rounded hover:bg-red-50"
        >
          <span v-if="sidebarOpen">Logout</span>
          <span v-else>🚪</span>
        </button>
      </div>
    </aside>

    <!-- Content -->
    <main class="flex-1 p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { logout } from "@/utils/auth";

const route = useRoute();
const sidebarOpen = ref(true);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

// 🔥 current user
const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem("user") || "null");
});

// 🔥 active highlight
const isActive = (path: string) => {
  return route.path === path
    ? "bg-blue-100 text-blue-700 font-semibold"
    : "text-gray-700";
};

const handleLogout = () => {
  logout();
};
</script>
