<template>
  <div>
    <!-- Page Title -->
    <h1 class="mb-6 text-2xl font-bold text-gray-800">
      Manage User Accounts
    </h1>

    <!-- Search & Filter -->
    <div class="flex flex-col gap-4 mb-4 md:flex-row">
      <input
        v-model="search"
        placeholder="Search by username or email"
        class="w-full px-3 py-2 border rounded md:w-1/2"
      />

      <select
        v-model="filterRole"
        class="w-full px-3 py-2 border rounded md:w-1/4"
      >
        <option value="">All Roles</option>
        <option value="MEMBER">MEMBER</option>
        <option value="OWNER">OWNER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
    </div>

    <!-- User Table -->
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full text-sm">
        <thead class="text-gray-600 bg-gray-50">
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
                class="px-2 py-1 border rounded"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="OWNER">OWNER</option>
              </select>
            </td>

            <!-- Status -->
            <td class="px-4 py-2">
              <span
                class="px-2 py-1 text-xs font-medium rounded"
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
            <td colspan="7" class="py-6 text-center text-gray-500">
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
const loading = ref(false);

/* ================= FETCH USERS ================= */
const fetchUsers = async () => {
  try {
    loading.value = true;

    const response = await fetch(
      "http://localhost:5000/api/users"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    users.value = await response.json();
  } catch (error) {
    console.error("Fetch users error:", error);
  } finally {
    loading.value = false;
  }
};

/* ================= UPDATE ROLE ================= */
const updateRole = async (user: User) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/users/${user.id}/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update role");
    }

    const data = await response.json();

    // อัปเดตค่าใน local state ให้ตรงกับ DB
    const index = users.value.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users.value[index].role = data.role;
    }

  } catch (error) {
    console.error("Update role error:", error);
    alert("Failed to update role");
    fetchUsers(); // rollback
  }
};

/* ================= TOGGLE STATUS ================= */
const toggleStatus = async (user: User) => {
  const newStatus = !user.isActive;

  try {
    const response = await fetch(
      `http://localhost:5000/api/users/${user.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update status");
    }

    user.isActive = newStatus;

  } catch (error) {
    console.error("Toggle status error:", error);
    alert("Failed to update status");
  }
};

/* ================= FILTER ================= */
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
