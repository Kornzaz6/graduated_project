<template>
  <div class="min-h-screen p-6 bg-gray-100">

    <!-- Current User Profile Card -->
    <div
      v-if="currentUser"
      class="flex items-center justify-between p-6 mb-6 bg-white shadow rounded-xl"
    >
      <div class="flex items-center gap-4">
        <!-- Avatar -->
        <div
          class="flex items-center justify-center text-xl font-bold text-white bg-blue-600 rounded-full w-14 h-14"
        >
          {{ currentUser.username.charAt(0).toUpperCase() }}
        </div>

        <!-- Info -->
        <div>
          <h2 class="text-lg font-semibold text-gray-800">
            Welcome, {{ currentUser.username }}
          </h2>
          <p class="text-sm text-gray-500">
            {{ currentUser.email }}
          </p>

          <div class="flex items-center gap-2 mt-2">
            <span
              class="px-2 py-1 text-xs font-medium rounded"
              :class="roleClass(currentUser.role)"
            >
              {{ currentUser.role }}
            </span>

            <span
              class="px-2 py-1 text-xs font-medium rounded"
              :class="currentUser.isActive ? 
                'bg-green-100 text-green-700' : 
                'bg-red-100 text-red-700'"
            >
              {{ currentUser.isActive ? "Active" : "Suspended" }}
            </span>
          </div>
        </div>
      </div>

      <button
        @click="logout"
        class="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">
        Dashboard
      </h1>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
      <div class="p-4 bg-white rounded-lg shadow">
        <p class="text-sm text-gray-500">Total Users</p>
        <p class="text-2xl font-bold text-blue-600">
          {{ users.length }}
        </p>
      </div>

      <div class="p-4 bg-white rounded-lg shadow">
        <p class="text-sm text-gray-500">Members</p>
        <p class="text-2xl font-bold text-green-600">
          {{ memberCount }}
        </p>
      </div>

      <div class="p-4 bg-white rounded-lg shadow">
        <p class="text-sm text-gray-500">Admins</p>
        <p class="text-2xl font-bold text-purple-600">
          {{ adminCount }}
        </p>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold text-gray-700">
          User List
        </h2>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="text-gray-600 bg-gray-50">
            <tr>
              <th class="px-4 py-3">ID</th>
              <th class="px-4 py-3">Username</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Created At</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="px-4 py-2">{{ user.id }}</td>
              <td class="px-4 py-2">{{ user.username }}</td>
              <td class="px-4 py-2">{{ user.email }}</td>
              <td class="px-4 py-2">
                <span
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="roleClass(user.role)"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-2">
                {{ formatDate(user.createdAt) }}
              </td>
            </tr>

            <tr v-if="users.length === 0">
              <td colspan="5" class="py-6 text-center text-gray-500">
                No users found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const users = ref<any[]>([]);
const currentUser = ref<any>(null);

// 🔥 ดึง current user จาก localStorage
onMounted(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser);
  }

  fetchUsers();
});

const fetchUsers = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/users");
    const data = await response.json();
    users.value = data;
  } catch (error) {
    console.error("Failed to fetch users", error);
  }
};

// summary
const memberCount = computed(
  () => users.value.filter(u => u.role === "MEMBER").length
);

const adminCount = computed(
  () => users.value.filter(u => u.role === "ADMIN").length
);

// helper
const roleClass = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-700";
    case "OWNER":
      return "bg-blue-100 text-blue-700";
    case "MEMBER":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const logout = () => {
  localStorage.removeItem("user");
  router.push("/login");
};
</script>
