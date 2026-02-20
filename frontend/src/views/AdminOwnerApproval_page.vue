<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <div class="max-w-4xl p-6 mx-auto bg-white rounded shadow">
      <h1 class="mb-6 text-2xl font-bold">
        Owner Applications
      </h1>

      <table class="w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left">User ID</th>
            <th class="p-3 text-left">Phone</th>
            <th class="p-3 text-left">Message</th>
            <th class="p-3 text-left">Status</th>
            <th class="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="app in applications"
            :key="app.id"
            class="border-t"
          >
            <td class="p-3">{{ app.userId }}</td>
            <td class="p-3">{{ app.phone }}</td>
            <td class="p-3">{{ app.message }}</td>
            <td class="p-3">
              <span
                :class="statusColor(app.status)"
                class="px-2 py-1 text-xs font-semibold rounded"
              >
                {{ app.status }}
              </span>
            </td>
            <td class="p-3 space-x-2">
              <button
                v-if="app.status === 'PENDING'"
                @click="approve(app.id)"
                class="px-3 py-1 text-xs text-white bg-green-600 rounded"
              >
                Approve
              </button>

              <button
                v-if="app.status === 'PENDING'"
                @click="reject(app.id)"
                class="px-3 py-1 text-xs text-white bg-red-600 rounded"
              >
                Reject
              </button>
            </td>
          </tr>

          <tr v-if="applications.length === 0">
            <td colspan="5" class="p-6 text-center text-gray-500">
              No applications found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface OwnerApplication {
  id: number;
  userId: number;
  phone: string;
  message: string;
  status: string;
}

const applications = ref<OwnerApplication[]>([]);

const fetchApplications = async () => {
  try {
    const res = await fetch(
      "http://localhost:5000/api/owners/applications"
    );
    applications.value = await res.json();
  } catch (error) {
    console.error(error);
  }
};

const approve = async (id: number) => {
  await fetch(
    `http://localhost:5000/api/owners/applications/${id}/approve`,
    { method: "PATCH" }
  );
  fetchApplications();
};

const reject = async (id: number) => {
  await fetch(
    `http://localhost:5000/api/owners/applications/${id}/reject`,
    { method: "PATCH" }
  );
  fetchApplications();
};

const statusColor = (status: string) => {
  if (status === "PENDING") return "bg-yellow-100 text-yellow-800";
  if (status === "APPROVED") return "bg-green-100 text-green-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  return "";
};

onMounted(fetchApplications);
</script>
