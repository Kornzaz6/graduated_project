<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="bg-white shadow-md transition-all duration-300"
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

      <!-- Menu -->
      <nav class="p-4 space-y-2">
        <router-link
          to="/dashboard"
          class="flex items-center space-x-2 px-3 py-2 rounded hover:bg-blue-100 text-gray-700"
        >
          <span>📊</span>
          <span v-if="sidebarOpen">Dashboard</span>
        </router-link>

        <router-link
          to="/manage-users"
          class="flex items-center space-x-2 px-3 py-2 rounded hover:bg-blue-100 text-gray-700"
        >
          <span>👤</span>
          <span v-if="sidebarOpen">Manage Users</span>
        </router-link>
      </nav>

      <!-- Logout -->
      <div class="absolute bottom-0 w-full p-4 border-t">
        <button
          @click="logout"
          class="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full"
        >
          <span>🚪</span>
          <span v-if="sidebarOpen">Logout</span>
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
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const sidebarOpen = ref(true);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const logout = () => {
  // ยังไม่ใช้ JWT → redirect ตรง ๆ
  router.push("/login");
};
</script>
