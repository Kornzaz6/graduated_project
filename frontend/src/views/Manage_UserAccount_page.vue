<template>
  <div>
    <!-- Page Title -->
    <h1 class="text-2xl font-bold text-gray-800 mb-6">
      Manage User Accounts
    </h1>

    <!-- Search & Filter -->
    <div class="flex flex-col md:flex-row gap-4 mb-4">
      <input
        v-model="search"
        placeholder="Search by username or email"
        class="border rounded px-3 py-2 w-full md:w-1/2"
      />

      <select
        v-model="filterRole"
        class="border rounded px-3 py-2 w-full md:w-1/4"
      >
        <option value="">All Roles</option>
        <option value="MEMBER">MEMBER</option>
        <option value="DORMITORY_STAFF">DORMITORY_STAFF</option>
        <option value="ADMIN">ADMIN</option>
      </select>
    </div>

    <!-- User Table -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Username</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-left">Role</th>
            <th class="px-4 py-3 text-left">Status</th>
            <th class="px-4 py-3 text-left">Created At</th>
            <th class="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-2">{{ user.id }}</td>
            <td class="px-4 py-2">{{ user.username }}</td>
            <td class="px-4 py-2">{{ user.email }}</td>

            <!-- Role -->
            <td class="px-4 py-2">
              <select
                v-model="user.role"
                @change="updateRole(user)"
                class="border rounded px-2 py-1"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="DORMITORY_STAFF">DORMITORY_STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </td>

            <!-- Status -->
            <td class="px-4 py-2">
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                :class="user.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'"
              >
                {{ user.isActive ? "Active" : "Suspended" }}
              </span>
            </td>

            <td class="px-4 py-2">
              {{ formatDate(user.createdAt) }}
            </td>

            <!-- Actions -->
            <td class="px-4 py-2">
              <button
                @click="toggleStatus(user)"
                class="text-sm"
                :class="user.isActive
                  ? 'text-red-600 hover:underline'
                  : 'text-green-600 hover:underline'"
              >
                {{ user.isActive ? "Suspend" : "Activate" }}
              </button>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="text-center py-6 text-gray-500">
              No users found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const users = ref<User[]>([]);
const search = ref("");
const filterRole = ref("");

// fetch all users
const fetchUsers = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/users"
    );
    users.value = await response.json();
  } catch (error) {
    console.error("Failed to fetch users", error);
  }
};

// update role
const updateRole = async (user: User) => {
  await fetch(
    `http://localhost:5000/api/auth/users/${user.id}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role }),
    }
  );
};

// suspend / activate
const toggleStatus = async (user: User) => {
  const newStatus = !user.isActive;

  await fetch(
    `http://localhost:5000/api/auth/users/${user.id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    }
  );

  user.isActive = newStatus;
};

// search & filter
const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.value.toLowerCase()) ||
      u.email.toLowerCase().includes(search.value.toLowerCase());

    const matchRole =
      filterRole.value === "" || u.role === filterRole.value;

    return matchSearch && matchRole;
  });
});

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString();

onMounted(fetchUsers);
</script>
