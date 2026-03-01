<template>
  <div class="min-h-screen p-8 bg-gray-100">

    <div class="p-8 mx-auto bg-white shadow-xl max-w-7xl rounded-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">
            Manage Owners
          </h1>
          <p class="text-sm text-gray-500">
            Total Owners: {{ filteredOwners.length }}
          </p>
        </div>

        <input
          v-model="search"
          placeholder="Search by name or email"
          class="px-4 py-2 border rounded-lg w-72"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500">
        Loading owners...
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto rounded-xl">
        <table class="min-w-full text-sm">
          <thead class="text-gray-600 bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left">Owner ID</th>
              <th class="px-6 py-3 text-left">Name</th>
              <th class="px-6 py-3 text-left">Email</th>
              <th class="px-6 py-3 text-left">Phone</th>
              <th class="px-6 py-3 text-left">Dormitories</th>
              <th class="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="owner in filteredOwners"
              :key="owner.id"
              class="border-t hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                {{ owner.id }}
              </td>

              <td class="px-6 py-4 font-medium">
                {{ owner.user.firstName }}
                {{ owner.user.lastName }}
              </td>

              <td class="px-6 py-4 text-gray-600">
                {{ owner.user.email }}
              </td>

              <td class="px-6 py-4">
                {{ owner.phone }}
              </td>

              <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full">
                  {{ owner.dormitories.length }} dorm(s)
                </span>
              </td>

              <td class="px-6 py-4">
                <button
                  @click="confirmRemove(owner)"
                  :disabled="removingId === owner.id"
                  class="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {{ removingId === owner.id ? "Removing..." : "Remove Owner" }}
                </button>
              </td>
            </tr>

            <tr v-if="filteredOwners.length === 0">
              <td colspan="6" class="py-12 text-center text-gray-400">
                No owners found
              </td>
            </tr>

          </tbody>
        </table>
      </div>

    </div>

    <!-- Toast -->
    <div
      v-if="toast"
      class="fixed px-6 py-3 text-white bg-black rounded-lg shadow-lg bottom-6 right-6"
    >
      {{ toast }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"

const owners = ref<any[]>([])
const loading = ref(true)
const search = ref("")
const removingId = ref<number | null>(null)
const toast = ref("")

const currentUser = JSON.parse(localStorage.getItem("user") || "null")

/* ================= FETCH ================= */
const fetchOwners = async () => {
  try {
    loading.value = true

    const response = await fetch(
      "http://localhost:5000/api/owners"
    )

    owners.value = await response.json()

  } catch (error) {
    console.error("Fetch owners error:", error)
  } finally {
    loading.value = false
  }
}

/* ================= FILTER ================= */
const filteredOwners = computed(() => {
  return owners.value.filter((owner) => {
    const fullName =
      owner.user.firstName + " " + owner.user.lastName

    return (
      fullName.toLowerCase().includes(search.value.toLowerCase()) ||
      owner.user.email.toLowerCase().includes(search.value.toLowerCase())
    )
  })
})

/* ================= REMOVE ================= */
const confirmRemove = (owner: any) => {
  if (owner.user.id === currentUser?.id) {
    alert("You cannot remove yourself.")
    return
  }

  if (confirm("Are you sure you want to remove this owner?")) {
    removeOwner(owner.id)
  }
}

const removeOwner = async (id: number) => {
  try {
    removingId.value = id

    const response = await fetch(
      `http://localhost:5000/api/owners/${id}`,
      { method: "DELETE" }
    )

    if (!response.ok) {
      throw new Error("Failed to remove owner")
    }

    toastMessage("Owner removed successfully")
    fetchOwners()

  } catch (error) {
    console.error(error)
    alert("Failed to remove owner")
  } finally {
    removingId.value = null
  }
}

/* ================= TOAST ================= */
const toastMessage = (message: string) => {
  toast.value = message
  setTimeout(() => {
    toast.value = ""
  }, 3000)
}

onMounted(fetchOwners)
</script>