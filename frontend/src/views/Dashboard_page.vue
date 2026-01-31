<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">
        Dashboard
      </h1>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-gray-500 text-sm">Total Users</p>
        <p class="text-2xl font-bold text-blue-600">
          {{ users.length }}
        </p>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-gray-500 text-sm">Members</p>
        <p class="text-2xl font-bold text-green-600">
          {{ memberCount }}
        </p>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-gray-500 text-sm">Admins</p>
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
          <thead class="bg-gray-50 text-gray-600">
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
                  class="px-2 py-1 rounded text-xs font-medium"
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
              <td colspan="5" class="text-center py-6 text-gray-500">
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

const fetchUsers = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/users");
    const data = await response.json();
    users.value = data;
  } catch (error) {
    console.error("Failed to fetch users", error);
  }
};

onMounted(() => {
  fetchUsers();
});

// summary counts
const memberCount = computed(
  () => users.value.filter(u => u.role === "MEMBER").length
);
const adminCount = computed(
  () => users.value.filter(u => u.role === "ADMIN").length
);

// helpers
const roleClass = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-700";
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
  // ตอนนี้ยังไม่มี auth state → redirect ตรง ๆ
  router.push("/login");
};
</script>
