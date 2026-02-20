<template>
  <div class="min-h-screen p-6 bg-gray-100">
    <div class="max-w-5xl p-6 mx-auto bg-white rounded shadow">

      <h2 class="mb-6 text-2xl font-bold">
        Owner Applications (Admin)
      </h2>

      <div v-if="loading" class="text-gray-500">
        Loading applications...
      </div>

      <table
        v-else
        class="min-w-full text-sm border"
      >
        <thead class="bg-gray-100">
          <tr>
            <th class="p-3 text-left border">User</th>
            <th class="p-3 text-left border">Phone</th>
            <th class="p-3 text-left border">Message</th>
            <th class="p-3 text-left border">Status</th>
            <th class="p-3 text-left border">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="app in applications"
            :key="app.id"
            class="border-t"
          >
            <td class="p-3 border">
              {{ app.user.username }} <br />
              <span class="text-xs text-gray-500">
                {{ app.user.email }}
              </span>
            </td>

            <td class="p-3 border">
              {{ app.phone }}
            </td>

            <td class="p-3 border">
              {{ app.message }}
            </td>

            <td class="p-3 border">
              <span
                :class="{
                  'text-yellow-600': app.status === 'PENDING',
                  'text-green-600': app.status === 'APPROVED',
                  'text-red-600': app.status === 'REJECTED'
                }"
              >
                {{ app.status }}
              </span>
            </td>

            <td class="p-3 space-x-2 border">

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
        </tbody>
      </table>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const applications = ref<any[]>([]);
const loading = ref(true);

const fetchApplications = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/owners/applications"
    );
    const data = await response.json();
    applications.value = data;
  } catch (error) {
    console.error("Failed to fetch applications", error);
  } finally {
    loading.value = false;
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

onMounted(() => {
  fetchApplications();
});
</script>
