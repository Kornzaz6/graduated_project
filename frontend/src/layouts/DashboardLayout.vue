<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="transition-all duration-300 bg-white shadow-md"
      :class="sidebarOpen ? 'w-64' : 'w-16'"
    >
      <!-- Logo / Toggle -->
      <div class="flex items-center justify-between p-4 border-b">
        <span
          v-if="sidebarOpen"
          class="text-lg font-bold text-blue-600"
        >
          Dormitory Hub
        </span>
        <button
          @click="toggleSidebar"
          class="text-gray-600 hover:text-blue-600"
        >
          ☰
        </button>
      </div>

      <!-- User Profile -->
<div
  v-if="currentUser"
  class="flex items-center gap-3 p-4 border-b"
>
  <div class="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-full">
    {{ currentUser.firstName?.charAt(0) || currentUser.username?.charAt(0) }}
  </div>

  <div v-if="sidebarOpen" class="flex flex-col">
    <span class="text-sm font-semibold">
      {{ currentUser.firstName }} {{ currentUser.lastName }}
    </span>
    <span class="text-xs text-gray-500">
      {{ currentUser.role }}
    </span>
  </div>
</div>


      <!-- Menu -->
      <!-- admin only -->
      <nav class="p-4 space-y-2">
        <router-link v-if="currentUser?.role == 'ADMIN'"
          to="/dashboard"
          class="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded hover:bg-blue-100"
        >
          <span>📊</span>
          <span v-if="sidebarOpen">Dashboard</span>
        </router-link>

        <router-link v-if="currentUser?.role == 'ADMIN'"
          to="/manage-users"
          class="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded hover:bg-blue-100"
        >
          <span>👤</span>
          <span v-if="sidebarOpen">Manage Users</span>
        </router-link>

        <router-link v-if="currentUser?.role == 'ADMIN'"
          to="/apply-owner"
          class="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded hover:bg-blue-100"
        >
          <span>📝</span>
          <span v-if="sidebarOpen">Apply Owner</span>
        </router-link>

        <router-link v-if="currentUser?.role == 'ADMIN'"
          to="/admin/owner-applications"
          class="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded hover:bg-blue-100"
        >
          <span>📋</span>
          <span v-if="sidebarOpen">Owner Applications</span>
        </router-link>

        <router-link v-if="currentUser?.role == 'ADMIN'"
          to="/admin/owner-approval"
          class="flex items-center px-3 py-2 space-x-2 text-gray-700 rounded hover:bg-blue-100"
        >
          <span>✅</span>
          <span v-if="sidebarOpen">Owner Approval</span>
        </router-link>
      </nav>

      <!-- Logout -->
      <div class="absolute bottom-0 w-full p-4 border-t">
        <button
  @click="handleLogout"
  class="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
>
  Logout
</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { logout } from "@/utils/auth";

const sidebarOpen = ref(true);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

// 🔥 ดึง user ปัจจุบัน
const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem("user") || "null");
});

const handleLogout = () => {
  logout();
};
</script>


